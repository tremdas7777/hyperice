// Pedidos Pix guardados no servidor para que a aprovação seja reportada
// (UTMify + Meta CAPI) mesmo que o cliente feche a página. Somente servidor.
import { sendUtmifyOrder, type UtmParams } from "@/lib/utmify.server";
import { sendCapiEvent } from "@/lib/meta.server";
import { sendRotasyncOrder, type RotasyncAddress } from "@/lib/rotasync.server";
import { product } from "@/data/store";
import type { CartItem } from "@/lib/cart";
import { orderSummary } from "@/lib/order";
import { isPaidStatus } from "@/lib/pix-status";
import { getPixgateKey, PIXGATE_API } from "@/lib/pixgate.server";
import type { UpsellProduct } from "@/lib/upsell";
import { getCardTransaction, isCardOrderId, CARD_ORDER_PREFIX } from "@/lib/hypercash.server";

export type StoredCustomer = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  endereco?: string | undefined;
  /** Endereço por partes (para a Rotasync e o cartão). */
  address?: RotasyncAddress | undefined;
  /** Itens do pedido (cor e tamanho de cada par). */
  items?: CartItem[] | undefined;
  frete?: { id: string; name: string; price: number } | undefined;
  bumps?: { id: string; name: string; price: number }[] | undefined;
  /** Id do pedido original quando este é um upsell pós-compra. */
  upsellOf?: string | undefined;
  /** Ofertas pós-compra desta cobrança (meias, bonés, seguro de entrega ou envio expresso). */
  upsellItems?: UpsellProduct[] | undefined;
  /** Tamanho das meias do pós-compra. */
  sockSize?: string | undefined;
  /** Código Pix copia-e-cola (guardado no upsell para reexibir sem cobrar de novo). */
  qrcode?: string | undefined;
  /** Forma de pagamento (pedidos antigos não têm: são Pix). */
  method?: "pix" | "card" | undefined;
  installments?: number | undefined;
  card?: { brand?: string | undefined; lastDigits?: string | undefined } | undefined;
  /** Desconto do Pix aplicado (reais). */
  discount?: number | undefined;
  /** Cobrança de teste (admin) feita após o pedido indicado. Não é reportada a lugar nenhum. */
  testOf?: string | undefined;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Tabela nova ainda não presente nos tipos gerados.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resposta do gateway/banco sem tipo
  return supabaseAdmin as unknown as { from: (t: string) => any };
}

export async function saveOrder(o: {
  id: string;
  amountCents: number;
  customer: StoredCustomer;
  bundleId: string;
  bundleName: string;
  utm?: UtmParams | undefined;
  ip?: string | null | undefined;
  ua?: string | null | undefined;
  fbp?: string | null | undefined;
  fbc?: string | null | undefined;
  /** Momento da criação (ms). O mesmo valor vai para a UTMify no "pendente" e no "pago". */
  createdAt?: number | undefined;
}): Promise<void> {
  try {
    const db = await admin();
    const { error } = await db.from("pix_orders").upsert({
      id: o.id,
      ...(o.createdAt ? { created_at: new Date(o.createdAt).toISOString() } : {}),
      amount_cents: o.amountCents,
      customer: o.customer,
      bundle_id: o.bundleId,
      bundle_name: o.bundleName,
      utm: o.utm ?? {},
      ip: o.ip ?? null,
      ua: o.ua ?? null,
      fbp: o.fbp ?? null,
      fbc: o.fbc ?? null,
    });
    if (error) console.error("saveOrder error", error.message);
  } catch (e) {
    console.error("saveOrder failed", e);
  }
}

export type StoredOrder = {
  id: string;
  status: string;
  amount_cents: number;
  customer: StoredCustomer;
  bundle_id: string;
  bundle_name: string;
  utm: UtmParams | null;
  fbp: string | null;
  fbc: string | null;
};

export async function getOrder(id: string): Promise<StoredOrder | null> {
  const db = await admin();
  const { data } = await db.from("pix_orders").select("*").eq("id", id).maybeSingle();
  return (data as StoredOrder | null) ?? null;
}

/**
 * Upsell já gerado para um pedido (evita cobranças duplicadas). São duas etapas independentes:
 * as ofertas (kit e/ou seguro) e, depois, o envio expresso.
 */
export async function findUpsellOf(parentId: string, express = false): Promise<StoredOrder | null> {
  const db = await admin();
  const { data } = await db
    .from("pix_orders")
    .select("*")
    .eq("customer->>upsellOf", parentId)
    .order("created_at", { ascending: false })
    .limit(10);
  const rows = (data ?? []) as StoredOrder[];
  return rows.find((o) => !!o.customer?.upsellItems?.includes("expresso") === express) ?? null;
}

/**
 * Avisa a UTMify que o Pix foi gerado (status "waiting_payment"). Isso NÃO conta como venda/conversão:
 * a UTMify só considera venda quando o mesmo orderId chega depois com status "paid".
 */
export async function reportPendingToUtmify(o: {
  id: string;
  amountCents: number;
  customer: StoredCustomer;
  bundleId: string;
  bundleName: string;
  utm?: UtmParams | undefined;
  ip?: string | null | undefined;
  createdAt: number;
}): Promise<void> {
  const r = await sendUtmifyOrder({
    orderId: o.id,
    status: "waiting_payment",
    // A UTMify exige a MESMA data de criação no envio pendente e no pago.
    createdAt: o.createdAt,
    approvedAt: null,
    customer: {
      name: o.customer.name,
      email: o.customer.email,
      phone: o.customer.phone,
      document: o.customer.cpf,
      ip: o.ip ?? null,
    },
    product: { id: o.bundleId, name: `${product.name} - ${o.bundleName}` },
    amountCents: o.amountCents,
    utm: o.utm ?? {},
    paymentMethod: o.customer.method === "card" ? "credit_card" : "pix",
  });
  if (!r.ok) console.error("UTMify pending failed", o.id, r.error);
  // Guarda a resposta no pedido para aparecer no admin (seção Técnico).
  try {
    const db = await admin();
    await db
      .from("pix_orders")
      .update({ report_result: { utmifyPending: { ...r, at: new Date().toISOString() } } })
      .eq("id", o.id)
      .is("paid_reported_at", null);
  } catch (e) {
    console.error("UTMify pending save failed", e);
  }
}

export { isPaidStatus };

/** Consulta o status real no gateway. */
export async function fetchGatewayStatus(id: string): Promise<{ status: string; amount: number }> {
  if (isCardOrderId(id)) {
    const tx = await getCardTransaction(id.slice(CARD_ORDER_PREFIX.length));
    // HyperCash já devolve o valor em centavos.
    return { status: tx?.status ?? "processing", amount: tx?.amount ?? 0 };
  }
  const key = await getPixgateKey();
  if (!key) throw new Error("Pagamento indisponível no momento.");
  const res = await fetch(`${PIXGATE_API}/stats/${encodeURIComponent(id)}`, {
    headers: { Apikey: key, Accept: "application/json" },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resposta do gateway/banco sem tipo
  const json = (await res.json().catch(() => null)) as any;
  // Status bruto no log (só status e nomes dos campos, sem dados pessoais) para auditar a regra de "pago".
  console.log(
    "pixgate-status",
    id,
    JSON.stringify(json?.status),
    Object.keys(json ?? {}).join(","),
  );
  // PixGate devolve o valor em reais; mantemos tudo em centavos internamente.
  return {
    status: String(json?.status ?? "pending").toLowerCase(),
    amount: Math.round(Number(json?.value ?? 0) * 100),
  };
}

/**
 * Reporta a venda aprovada uma única vez (idempotente via paid_reported_at).
 * `extra` traz cookies do Meta/URL quando a chamada vem do navegador.
 */
export async function reportPaidOnce(
  id: string,
  gatewayAmount: number,
  extra?: {
    fbp?: string | null | undefined;
    fbc?: string | null | undefined;
    url?: string | undefined;
    ip?: string | null | undefined;
    ua?: string | null | undefined;
  },
): Promise<void> {
  try {
    const db = await admin();
    // Trava atômica: só quem conseguir marcar paid_reported_at envia.
    const { data: rows, error } = await db
      .from("pix_orders")
      .update({
        status: "paid",
        paid_reported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("paid_reported_at", null)
      .select("*");
    if (error) {
      console.error("reportPaidOnce lock error", error.message);
      return;
    }
    const o = rows?.[0];
    if (!o) return; // já reportado ou pedido desconhecido

    // Cobrança de teste do admin: marca como paga, mas não vira venda em lugar nenhum.
    if ((o.customer as StoredCustomer)?.testOf) {
      await db
        .from("pix_orders")
        .update({
          report_result: { skipped: "cobrança de teste do admin", at: new Date().toISOString() },
        })
        .eq("id", id);
      return;
    }

    const amount =
      Number.isFinite(gatewayAmount) && gatewayAmount > 0 ? gatewayAmount : o.amount_cents;
    const c = o.customer as StoredCustomer;
    const productName = `${product.name} - ${o.bundle_name}`;
    // Canal que já confirmou o recebimento numa tentativa anterior não recebe de novo (sem duplicar venda).
    const done = (o.report_result ?? {}) as { utmify?: { ok?: boolean }; meta?: { ok?: boolean } };
    const utmify = done.utmify?.ok
      ? done.utmify
      : await sendUtmifyOrder({
          orderId: id,
          status: "paid",
          createdAt: new Date(o.created_at).getTime(),
          approvedAt: Date.now(),
          customer: { name: c.name, email: c.email, phone: c.phone, document: c.cpf, ip: o.ip },
          product: { id: o.bundle_id, name: productName },
          amountCents: amount,
          utm: o.utm ?? {},
          paymentMethod: c.method === "card" ? "credit_card" : "pix",
        });
    const meta = done.meta?.ok
      ? done.meta
      : await sendCapiEvent({
          eventName: "Purchase",
          eventId: `purchase-${id}`,
          url: extra?.url,
          user: {
            email: c.email,
            phone: c.phone,
            name: c.name,
            cpf: c.cpf,
            fbp: extra?.fbp ?? o.fbp ?? null,
            fbc: extra?.fbc ?? o.fbc ?? null,
            ip: extra?.ip ?? o.ip ?? null,
            ua: extra?.ua ?? o.ua ?? null,
          },
          customData: {
            value: amount / 100,
            currency: "BRL",
            content_name: productName,
            content_ids: [o.bundle_id],
            content_type: "product",
            order_id: id,
          },
        });
    // Rastreio (Rotasync): só pedidos principais com endereço completo. O upsell vai no mesmo envio do pedido original.
    // Se a API já respondeu de forma definitiva (sucesso, 422, 401, 402, 403), não reenvia.
    const prev = (
      o.report_result as { rastro?: { ok?: boolean | undefined; status?: number } } | null
    )?.rastro;
    const rastroDone =
      !!prev && (prev.ok || [401, 402, 403, 413, 415, 422].includes(prev.status ?? 0));
    const rastro = rastroDone
      ? prev
      : c.upsellOf
        ? { ok: true, skipped: "upsell enviado junto com o pedido original" }
        : !c.address
          ? { ok: false, skipped: "pedido sem endereço por partes" }
          : !c.items?.length
            ? { ok: false, skipped: "pedido sem itens" }
            : await sendRotasyncOrder({
                transactionId: id,
                customer: { name: c.name, email: c.email, phone: c.phone, document: c.cpf },
                address: c.address,
                // Um item por par (cor e numeração).
                products: orderSummary(c.items).shipItems,
              });
    // O rastreio fica fora do allOk: é idempotente por external_id e um 422 não deve ser retentado.
    const allOk = utmify.ok && meta.ok;
    console.log("reportPaidOnce", id, JSON.stringify({ utmify, meta, rastro }));
    // Guarda o resultado; se algo falhou, libera a trava para nova tentativa.
    await db
      .from("pix_orders")
      .update({
        report_result: {
          ...((o.report_result as Record<string, unknown> | null) ?? {}),
          utmify,
          meta,
          rastro,
          at: new Date().toISOString(),
        },
        ...(allOk ? {} : { paid_reported_at: null }),
        ...(extra?.fbp ? { fbp: extra.fbp } : {}),
        ...(extra?.fbc ? { fbc: extra.fbc } : {}),
      })
      .eq("id", id);
  } catch (e) {
    console.error("reportPaidOnce failed", e);
  }
}
