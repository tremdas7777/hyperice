import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { store } from "@/data/store";
import type { CartItem } from "@/lib/cart";
import { cartSchema, orderSummary } from "@/lib/order";
import {
  saveOrder,
  fetchGatewayStatus,
  reportPaidOnce,
  reportPendingToUtmify,
  getOrder,
  findUpsellOf,
} from "@/lib/pix-orders.server";
import { createCardTransaction, CARD_ORDER_PREFIX, getHypercashKeys } from "@/lib/hypercash.server";
import { isPaidStatus } from "@/lib/pix-status";
import { UPSELL_PRODUCTS, upsellSelection } from "@/lib/upsell";
import { checkoutTotals, CARD_MAX_INSTALLMENTS } from "@/lib/payment-pricing";
import { FREE_SHIPPING_MIN, getFrete, isFreeShippingEligible } from "@/lib/shipping";

const utmSchema = z.record(z.string(), z.string().max(300).nullable()).optional().default({});

const API = "https://app.pixgateip.com/api";

function apiKey(): string {
  const key = process.env["PIXGATE_API_KEY"];
  if (!key) throw new Error("Pagamento indisponível no momento.");
  return key;
}

function isValidCpf(raw: string): boolean {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(c[i]) * (t + 1 - i);
    const d = ((sum * 10) % 11) % 10;
    if (d !== Number(c[t])) return false;
  }
  return true;
}

const customerSchema = z.object({
  items: cartSchema,
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(11)),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(isValidCpf, "CPF inválido"),
  origin: z.string().url(),
  frete: z.enum(["gratis", "padrao", "express"]).default("gratis"),
  endereco: z.string().max(300).optional(),
  // Endereço por partes (Rotasync e cartão).
  address: z
    .object({
      street: z.string().trim().min(1).max(200),
      number: z.string().trim().min(1).max(20),
      complement: z.string().trim().max(200).optional(),
      neighborhood: z.string().trim().min(1).max(120),
      city: z.string().trim().min(1).max(120),
      state: z.string().trim().length(2),
      zipcode: z.string().regex(/^\d{8}$/),
    })
    .optional(),
  utm: utmSchema,
});

type CustomerInput = z.infer<typeof customerSchema>;

/** Pedido com preço do servidor, a partir dos itens da sacola. */
function buildOrder(d: CustomerInput) {
  const items = d.items as CartItem[];
  return { items, summary: orderSummary(items) };
}

function assertShipping(d: CustomerInput, products: number) {
  if (d.frete === "gratis" && !isFreeShippingEligible(products)) {
    throw new Error(
      `Frete grátis disponível apenas para compras acima de R$ ${FREE_SHIPPING_MIN}.`,
    );
  }
}

export type PixCharge = { id: string; qrcode: string; amount: number; status: string };

/** Gera a cobrança Pix na PixGate. Valor em centavos. */
async function gatewayCashin(o: { name: string; cpf: string; amount: number; origin: string }) {
  // PixGate recebe o valor em reais (decimal); internamente seguimos em centavos.
  const valor = Number((o.amount / 100).toFixed(2));
  const res = await fetch(`${API}/v1/cashin`, {
    method: "POST",
    headers: { Apikey: apiKey(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      nome: o.name,
      cpf: o.cpf,
      valor,
      // Nome genérico enviado ao gateway — sem detalhes do produto real.
      descricao: store.gatewayName,
      postback: `${new URL(o.origin).origin}/api/public/pix-webhook`,
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resposta do gateway/banco sem tipo
  const json = (await res.json().catch(() => null)) as any;
  const txId = json?.id;
  const qrcode = json?.pix;
  if (!res.ok || !txId || !qrcode) {
    console.error("PixGate error", res.status, JSON.stringify(json)?.slice(0, 500));
    throw new Error("Não foi possível gerar o Pix. Confira seus dados e tente novamente.");
  }
  return {
    id: String(txId),
    qrcode: String(qrcode),
    status: String(json?.status ?? "pending").toLowerCase(),
  };
}

function requestMeta() {
  const h = getRequest()?.headers;
  return {
    ip: h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    ua: h?.get("user-agent") ?? null,
  };
}

export const createPixCharge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => customerSchema.parse(d))
  .handler(async ({ data }): Promise<PixCharge> => {
    // Preço sempre definido no servidor — nunca confiar no cliente.
    const order = buildOrder(data);
    assertShipping(data, order.summary.products);
    const freteOpt = getFrete(data.frete);
    // Pix: desconto nos produtos (o frete não entra no desconto), quando o cartão está ativo.
    const totals = checkoutTotals({
      products: order.summary.products,
      frete: freteOpt.price,
      method: "pix",
      pixDiscount: await isCardEnabled().catch(() => false),
    });
    const amount = totals.total;
    const charge = await gatewayCashin({
      name: data.name,
      cpf: data.cpf,
      amount,
      origin: data.origin,
    });
    const { ip, ua } = requestMeta();
    // Guarda o pedido no servidor para reportar a aprovação mesmo sem o cliente na página.
    const orderData = {
      createdAt: Date.now(),
      id: charge.id,
      amountCents: amount,
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        endereco: data.endereco?.replace(/\s+/g, " ").trim(),
        ...(data.address ? { address: data.address } : {}),
        items: order.items,
        // Pix copia e cola, para o admin poder reenviar ao cliente.
        qrcode: charge.qrcode,
        frete: { id: freteOpt.id, name: freteOpt.name, price: freteOpt.price },
        method: "pix" as const,
        discount: totals.discount / 100,
      },
      bundleId: order.summary.bundleId,
      bundleName: order.summary.bundleName,
      utm: data.utm,
      ip,
      ua,
    };
    await saveOrder(orderData);
    // Pix gerado → UTMify como pendente (não é conversão; só "paid" conta como venda).
    await reportPendingToUtmify(orderData);
    return { id: charge.id, qrcode: charge.qrcode, amount, status: charge.status };
  });

export type CardCharge = { id: string; amount: number; status: string; paid: boolean };

/** Liga/desliga do cartão no admin (site_settings.card_enabled). DESLIGADO até ativar no painel. */
async function isCardEnabled(): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "card_enabled")
    .maybeSingle();
  return data?.value === true;
}

/** Com o cartão desligado, quem está logado no admin (mesmo navegador) ainda consegue testar. */
const isAdmin = (pwd?: string) => !!pwd && pwd === process.env["ADMIN_PASSWORD"];

/** Chave PÚBLICA da HyperCash (pode ir para o navegador; a secreta fica só no servidor). */
export const getCardConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ adminPassword: z.string().max(200).optional() })
      .optional()
      .parse(d),
  )
  .handler(async ({ data }) => {
    // Liberado aos clientes no admin = cartão para todos + desconto do Pix.
    const publicOn = await isCardEnabled().catch(() => false);
    const enabled = publicOn || isAdmin(data?.adminPassword);
    const publicKey = enabled ? (await getHypercashKeys().catch(() => null))?.public : null;
    return { enabled: enabled && !!publicKey, publicKey: publicKey ?? null, pixDiscount: publicOn };
  });

const cardSchema = customerSchema.extend({
  // Token gerado pelo SDK da HyperCash no navegador. O número do cartão nunca chega aqui.
  cardHash: z.string().min(10).max(4000),
  installments: z.number().int().min(1).max(CARD_MAX_INSTALLMENTS),
  adminPassword: z.string().max(200).optional(),
});

/** Cobra no cartão (HyperCash). Preço de tabela, sem o desconto do Pix. */
export const createCardCharge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => cardSchema.parse(d))
  .handler(async ({ data }): Promise<CardCharge> => {
    if (!isAdmin(data.adminPassword) && !(await isCardEnabled()))
      throw new Error("Pagamento com cartão indisponível. Pague com Pix.");
    const order = buildOrder(data);
    assertShipping(data, order.summary.products);
    if (!data.address) throw new Error("Confira o CEP e o endereço de entrega.");
    const freteOpt = getFrete(data.frete);
    const totals = checkoutTotals({
      products: order.summary.products,
      frete: freteOpt.price,
      method: "card",
      pixDiscount: false,
    });
    const { ip, ua } = requestMeta();
    const a = data.address;
    const address = {
      street: a.street,
      streetNumber: a.number,
      complement: a.complement || "Sem complemento",
      zipCode: a.zipcode,
      neighborhood: a.neighborhood,
      city: a.city,
      state: a.state.toUpperCase(),
      country: "BR" as const,
    };
    const tx = await createCardTransaction({
      amount: totals.total,
      cardHash: data.cardHash,
      installments: data.installments,
      customer: { name: data.name, email: data.email, phone: data.phone, cpf: data.cpf },
      address,
      shippingFee: totals.frete,
      // Nome genérico (igual ao Pix) — sem detalhes do produto real na fatura.
      items: order.summary.lines.map((l) => ({
        title: store.gatewayName,
        unitPrice: Math.round(l.price * 100),
        quantity: 1,
      })),
      postbackUrl: `${new URL(data.origin).origin}/api/public/pix-webhook?gw=hc`,
      ip,
    });
    if (["refused", "canceled", "cancelled", "failed"].includes(tx.status)) {
      throw new Error(
        `Pagamento recusado: ${tx.refusedReason ?? "o banco emissor não informou o motivo"}. Confira os dados do cartão ou pague com Pix.`,
      );
    }
    const id = `${CARD_ORDER_PREFIX}${tx.id}`;
    const orderData = {
      createdAt: Date.now(),
      id,
      amountCents: totals.total,
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        endereco: data.endereco?.replace(/\s+/g, " ").trim(),
        address: data.address,
        items: order.items,
        frete: { id: freteOpt.id, name: freteOpt.name, price: freteOpt.price },
        method: "card" as const,
        installments: data.installments,
        ...(tx.card ? { card: tx.card } : {}),
      },
      bundleId: order.summary.bundleId,
      bundleName: order.summary.bundleName,
      utm: data.utm,
      ip,
      ua,
    };
    await saveOrder(orderData);
    const paid = isPaidStatus(tx.status);
    // Aprovado na hora: a conversão é reportada pela página do pedido (getPixStatus → reportPaidOnce).
    // Em análise: avisa a UTMify como pendente, igual ao Pix gerado.
    if (!paid) await reportPendingToUtmify(orderData);
    return { id, amount: totals.total, status: tx.status, paid };
  });

/**
 * Etapa do pós-compra: seguro de entrega ou envio expresso, que tem página própria e cobrança
 * separada. Devolve a cobrança já feita nesta etapa, se houver.
 */
async function upsellStep(parentId: string, products: readonly string[]) {
  const express = products.includes("expresso");
  if (express && products.length > 1) throw new Error("Oferta inválida.");
  return { existing: await findUpsellOf(parentId, express) };
}

const upsellOffersSchema = {
  origin: z.string().url(),
  // Ofertas marcadas na tela pós-compra (seguro de entrega ou envio expresso), numa cobrança só.
  products: z.array(z.enum(UPSELL_PRODUCTS)).min(1).max(UPSELL_PRODUCTS.length),
};

/**
 * Upsell no MESMO cartão da compra (o token do cartão volta do navegador; nada é guardado no banco).
 * Só roda quando o cliente clica em aceitar a oferta.
 */
export const createCardFollowUpCharge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        parentId: z.string().regex(/^hc_[\w-]{1,64}$/),
        cardHash: z.string().min(10).max(4000),
        ...upsellOffersSchema,
      })
      .parse(d),
  )
  .handler(
    async ({ data }): Promise<CardCharge & { refusedReason?: string | null | undefined }> => {
      const parent = await getOrder(data.parentId);
      if (
        !parent ||
        parent.customer?.upsellOf ||
        parent.customer?.testOf ||
        parent.customer?.method !== "card"
      )
        throw new Error("Pedido não encontrado.");
      if (!parent.customer.address) throw new Error("Pedido sem endereço.");
      if (!isPaidStatus(parent.status)) {
        const { status } = await fetchGatewayStatus(parent.id);
        if (!isPaidStatus(status)) throw new Error("Pedido ainda não foi pago.");
      }
      // Nunca cobra duas vezes a mesma etapa do upsell para o mesmo pedido.
      const { existing } = await upsellStep(parent.id, data.products);
      if (existing) {
        return {
          id: existing.id,
          amount: existing.amount_cents,
          status: existing.status,
          paid: isPaidStatus(existing.status),
        };
      }

      const sel = upsellSelection(data.products);
      if (!sel.products.length) throw new Error("Escolha uma oferta.");
      const amount = Math.round(sel.total * 100);
      // Seguro e envio expresso: à vista.
      const installments = 1;
      const c = parent.customer;
      const a = c.address!;
      const { ip, ua } = requestMeta();
      const tx = await createCardTransaction({
        amount,
        cardHash: data.cardHash,
        installments,
        customer: { name: c.name, email: c.email, phone: c.phone, cpf: c.cpf },
        address: {
          street: a.street,
          streetNumber: a.number,
          complement: a.complement || "Sem complemento",
          zipCode: a.zipcode,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state.toUpperCase(),
          country: "BR",
        },
        shippingFee: 0,
        items: sel.items.map((i) => ({
          title: i.title,
          unitPrice: Math.round(i.price * 100),
          quantity: 1,
        })),
        postbackUrl: `${new URL(data.origin).origin}/api/public/pix-webhook?gw=hc`,
        ip,
      });
      const refused = ["refused", "canceled", "cancelled", "failed"].includes(tx.status);
      const id = `${CARD_ORDER_PREFIX}${tx.id}`;
      const orderData = {
        createdAt: Date.now(),
        id,
        amountCents: amount,
        customer: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          cpf: c.cpf,
          endereco: c.endereco,
          address: c.address,
          frete: { id: "junto", name: `Junto com o pedido ${parent.id}`, price: 0 },
          method: "card" as const,
          installments,
          ...(tx.card ? { card: tx.card } : {}),
          upsellOf: parent.id,
          upsellItems: sel.products,
        },
        bundleId: parent.bundle_id,
        bundleName: `Upsell: ${sel.label}`,
        utm: parent.utm ?? undefined,
        ip,
        ua,
        fbp: parent.fbp,
        fbc: parent.fbc,
      };
      if (refused)
        throw new Error(
          `O banco não aprovou a cobrança neste cartão: ${tx.refusedReason ?? "motivo não informado"}.`,
        );
      await saveOrder(orderData);
      const paid = isPaidStatus(tx.status);
      if (!paid) await reportPendingToUtmify(orderData);
      return { id, amount, status: tx.status, paid, refusedReason: tx.refusedReason };
    },
  );

/**
 * Pós-compra no Pix: seguro de entrega ou envio expresso, num Pix só.
 * Usa os dados já salvos do pedido original — o cliente não digita nada de novo.
 */
export const createUpsellCharge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ parentId: z.string().regex(/^[\w-]{1,64}$/), ...upsellOffersSchema }).parse(d),
  )
  .handler(async ({ data }): Promise<PixCharge> => {
    const parent = await getOrder(data.parentId);
    if (!parent || parent.customer?.upsellOf) throw new Error("Pedido não encontrado.");
    if (!isPaidStatus(parent.status)) {
      const { status } = await fetchGatewayStatus(parent.id);
      if (!isPaidStatus(status)) throw new Error("Pedido ainda não foi pago.");
    }

    // Já existe esta etapa do upsell para este pedido: reaproveita em vez de gerar outra cobrança.
    const { existing } = await upsellStep(parent.id, data.products);
    if (existing?.customer.qrcode) {
      return {
        id: existing.id,
        qrcode: existing.customer.qrcode,
        amount: existing.amount_cents,
        status: existing.status,
      };
    }

    const sel = upsellSelection(data.products);
    if (!sel.products.length) throw new Error("Escolha uma oferta.");
    const amount = Math.round(sel.total * 100);
    const c = parent.customer;
    const charge = await gatewayCashin({ name: c.name, cpf: c.cpf, amount, origin: data.origin });
    const { ip, ua } = requestMeta();
    const orderData = {
      createdAt: Date.now(),
      id: charge.id,
      amountCents: amount,
      customer: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        cpf: c.cpf,
        endereco: c.endereco,
        ...(c.address ? { address: c.address } : {}),
        frete: { id: "junto", name: `Junto com o pedido ${parent.id}`, price: 0 },
        upsellOf: parent.id,
        upsellItems: sel.products,
        qrcode: charge.qrcode,
      },
      bundleId: parent.bundle_id,
      bundleName: `Upsell: ${sel.label}`,
      utm: parent.utm ?? undefined,
      ip,
      ua,
      fbp: parent.fbp,
      fbc: parent.fbc,
    };
    await saveOrder(orderData);
    // Pix gerado → UTMify como pendente (não é conversão; só "paid" conta como venda).
    await reportPendingToUtmify(orderData);
    return { id: charge.id, qrcode: charge.qrcode, amount, status: charge.status };
  });

export const getPixStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().regex(/^[\w-]{1,64}$/),
        report: z
          .object({
            fbp: z.string().max(200).nullable().optional(),
            fbc: z.string().max(300).nullable().optional(),
            url: z.string().max(1000).optional(),
          })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ status: string; paid: boolean }> => {
    const { status, amount } = await fetchGatewayStatus(data.id);
    const paid = isPaidStatus(status);
    // Só pagamento confirmado pelo gateway (servidor) vira conversão — reportado uma única vez.
    if (paid) {
      const h = getRequest()?.headers;
      await reportPaidOnce(data.id, amount, {
        fbp: data.report?.fbp,
        fbc: data.report?.fbc,
        url: data.report?.url,
        ip: h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        ua: h?.get("user-agent") ?? null,
      });
    }
    return { status, paid };
  });
