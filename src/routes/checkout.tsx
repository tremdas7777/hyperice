import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CreditCard, Loader2, Lock, ShoppingBag } from "lucide-react";
import { product } from "@/data/store";
import { createCardCharge, createPixCharge, getCardConfig } from "@/lib/pix.functions";
import { CARD_MAX_INSTALLMENTS, checkoutTotals, PIX_DISCOUNT } from "@/lib/payment-pricing";
import {
  FRETES,
  FREE_SHIPPING_MIN,
  getFrete,
  isFreeShippingEligible,
  type FreteId,
} from "@/lib/shipping";
import { loadHypercash, tokenizeCard } from "@/lib/hypercash-sdk";
import { savePixSession } from "@/lib/pix-session";
import { getSessionId, getStoredUtms } from "@/lib/tracking";
import { trackCheckoutStep, type CheckoutStep } from "@/lib/checkout-tracking.functions";
import { getMetaCookies, metaTrack } from "@/lib/meta-pixel";
import { trackCheckoutClick } from "@/lib/analytics";
import { itemPairs } from "@/lib/cart";
import { orderSummary } from "@/lib/order";
import { cn } from "@/lib/utils";
import { useShop } from "@/state/shop";
import {
  brl,
  Card,
  CardHead,
  CheckoutFooter,
  CheckoutHeader,
  Field,
  PixIcon,
  PrimaryButton,
  Radio,
} from "@/components/checkout/parts";
import { SummaryDesktop, SummaryMobile } from "@/components/checkout/Summary";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `Checkout seguro | ${product.name}` },
      {
        name: "description",
        content: `Finalize sua compra do ${product.name} com segurança. Pagamento via Pix e frete grátis para todo o Brasil.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const digits = (v: string) => v.replace(/\D/g, "");
const maskCpf = (v: string) =>
  digits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (v: string) =>
  digits(v)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
const maskCep = (v: string) =>
  digits(v)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
/** Senha do admin salva na aba (login no /admin): libera o cartão para teste mesmo desligado. */
const adminPwd = () => {
  try {
    return sessionStorage.getItem("store_admin_pwd") ?? undefined;
  } catch {
    return undefined;
  }
};
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const maskCard = (v: string) =>
  digits(v)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExp = (v: string) =>
  digits(v)
    .slice(0, 4)
    .replace(/(\d{2})(\d)/, "$1/$2");
/** Dígito verificador do cartão (Luhn) — só para avisar erro de digitação antes de enviar. */
function luhnOk(raw: string) {
  const d = digits(raw);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2) n = n * 2 > 9 ? n * 2 - 9 : n * 2;
    sum += n;
  }
  return sum % 10 === 0;
}
function expOk(v: string) {
  const [m, y] = v.split("/");
  if (!m || !y || y.length !== 2) return false;
  const month = Number(m);
  const year = 2000 + Number(y);
  const now = new Date();
  return (
    month >= 1 &&
    month <= 12 &&
    (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1))
  );
}

type Step = 1 | 2 | 3;
type Addr = {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  cidade: string;
  uf: string;
};

function Page() {
  const { cart, cartLoaded } = useShop();
  if (!cartLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-bone">
        <CheckoutHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-heat" />
        </div>
      </div>
    );
  }
  if (cart.length === 0) return <EmptyCart />;
  return <Checkout />;
}

function EmptyCart() {
  return (
    <div className="flex min-h-screen flex-col bg-bone font-sans text-ink">
      <CheckoutHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white">
          <ShoppingBag className="h-7 w-7 text-mute" />
        </span>
        <h1 className="font-display text-4xl uppercase">Nenhum produto escolhido</h1>
        <p className="text-mute">Escolha a cor e a numeração do seu Hyperslide para continuar.</p>
        <a
          href="/#comprar"
          className="mt-2 rounded-full bg-heat px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover"
        >
          Escolher meu Hyperslide
        </a>
      </main>
      <CheckoutFooter />
    </div>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const { cart } = useShop();

  const summary = orderSummary(cart);
  const { lines, products } = summary;

  useEffect(() => {
    metaTrack("InitiateCheckout", { value: summary.products, contentName: summary.bundleName });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState<Step>(1);
  const [id, setId] = useState({ name: "", email: "", cpf: "", phone: "" });
  const [addr, setAddr] = useState<Addr>({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
    cidade: "",
    uf: "",
  });
  // Pix vem pré-selecionado; cartão em até 12x pelo preço de tabela.
  const [pay, setPay] = useState<"pix" | "card">("pix");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [installments, setInstallments] = useState(1);
  // Frete grátis a partir de FREE_SHIPPING_MIN em produtos (validado também no servidor).
  const freeEligible = isFreeShippingEligible(products);
  const [frete, setFrete] = useState<FreteId>(() => (freeEligible ? "gratis" : "padrao"));
  const wasEligible = useRef(freeEligible);
  useEffect(() => {
    if (!freeEligible && frete === "gratis") setFrete("padrao");
    if (freeEligible && !wasEligible.current) setFrete("gratis");
    wasEligible.current = freeEligible;
  }, [freeEligible, frete]);
  const createFn = useServerFn(createPixCharge);
  const cardFn = useServerFn(createCardCharge);
  const cardConfigFn = useServerFn(getCardConfig);
  const stepFn = useServerFn(trackCheckoutStep);

  const freteOpt = getFrete(frete);
  const freteValue = freteOpt.price;
  // Desconto do Pix só depois de liberar o cartão no admin (o servidor aplica a mesma regra).
  const [pixDiscountOn, setPixDiscountOn] = useState(false);
  const pixT = checkoutTotals({
    products,
    frete: freteValue,
    method: "pix",
    pixDiscount: pixDiscountOn,
  });
  const cardT = checkoutTotals({ products, frete: freteValue, method: "card", pixDiscount: false });
  const pixTotal = pixT.total / 100;
  const cardTotal = cardT.total / 100;
  const payTotal = pay === "pix" ? pixTotal : cardTotal;
  const discount = pay === "pix" ? pixT.discount / 100 : 0;

  // Cartão pode ser desativado no admin: a opção só aparece se estiver ativa.
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cardKey, setCardKey] = useState<string | null>(null);
  useEffect(() => {
    cardConfigFn({ data: { adminPassword: adminPwd() } })
      .then((c) => {
        setCardEnabled(c.enabled);
        setPixDiscountOn(c.pixDiscount);
        setCardKey(c.publicKey);
      })
      .catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Carrega o SDK assim que o cliente escolhe cartão.
  useEffect(() => {
    if (pay === "card" && cardKey) loadHypercash(cardKey).catch(() => undefined);
  }, [pay, cardKey]);
  useEffect(() => {
    if (!cardEnabled && pay === "card") setPay("pix");
  }, [cardEnabled, pay]);

  // Busca de endereço pelo CEP (ViaCEP, API pública)
  useEffect(() => {
    const c = digits(addr.cep);
    if (c.length !== 8) return;
    let alive = true;
    fetch(`https://viacep.com.br/ws/${c}/json/`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive || j.erro) return;
        setAddr((a) => ({
          ...a,
          rua: a.rua || j.logradouro,
          bairro: a.bairro || j.bairro,
          cidade: j.localidade,
          uf: j.uf,
        }));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [addr.cep]);

  // Registra cada etapa para a aba "Checkouts abandonados" do admin (nunca bloqueia a compra).
  const track = (s: CheckoutStep, extra: { pixId?: string } = {}) => {
    void stepFn({
      data: {
        sessionId: getSessionId(),
        step: s,
        plano: summary.bundleId,
        planoNome: summary.bundleName,
        value: payTotal,
        utm: getStoredUtms(),
        ...(s !== "checkout"
          ? {
              name: id.name,
              email: id.email,
              phone: id.phone,
              frete,
            }
          : {}),
        ...(s === "entrega" || s === "pix" ? { cidade: addr.cidade, uf: addr.uf } : {}),
        ...extra,
      },
    }).catch(() => undefined);
  };
  useEffect(() => {
    track("checkout");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const idValid =
    id.name.trim().split(" ").length >= 2 &&
    emailOk(id.email) &&
    digits(id.cpf).length === 11 &&
    digits(id.phone).length >= 10;
  const addrValid = digits(addr.cep).length === 8 && addr.rua && addr.numero && addr.bairro;

  // Por partes para a Rotasync e o cartão; só vai se o CEP trouxe cidade/UF (nunca trava o Pix).
  const structuredAddress = () =>
    addr.cidade.trim() && addr.uf.trim().length === 2 && digits(addr.cep).length === 8
      ? {
          street: addr.rua.trim(),
          number: addr.numero.trim(),
          ...(addr.complemento.trim() ? { complement: addr.complemento.trim() } : {}),
          neighborhood: addr.bairro.trim(),
          city: addr.cidade.trim(),
          state: addr.uf.trim(),
          zipcode: digits(addr.cep),
        }
      : undefined;
  const orderPayload = () => {
    const address = structuredAddress();
    return {
      ...id,
      items: cart,
      frete,
      origin: window.location.origin,
      utm: getStoredUtms(),
      endereco: `${addr.rua}, ${addr.numero} ${addr.complemento} - ${addr.bairro}, ${addr.cidade}/${addr.uf} ${addr.cep}`,
      ...(address ? { address } : {}),
    };
  };
  const mainSize = cart.flatMap(itemPairs)[0]?.size;
  const sessionBase = () => ({
    ...(mainSize ? { mainSize } : {}),
    email: id.email,
    name: id.name,
    bundleId: summary.bundleId,
    bundleName: summary.bundleName,
    lines: summary.lines,
    productPrice: summary.products,
    frete: freteValue,
    createdAt: Date.now(),
    phone: id.phone.replace(/\D/g, ""),
    cpf: id.cpf.replace(/\D/g, ""),
    utm: getStoredUtms(),
    ...getMetaCookies(),
  });

  const mutation = useMutation({
    mutationFn: () => createFn({ data: orderPayload() }),
    onSuccess: (c) => {
      savePixSession({
        ...sessionBase(),
        id: c.id,
        qrcode: c.qrcode,
        amount: c.amount,
        discount: pixT.discount / 100,
        method: "pix",
      });
      metaTrack("AddPaymentInfo", { value: pixTotal, contentName: summary.bundleName });
      trackCheckoutClick({
        source: "pix_generated",
        bundleId: summary.bundleId,
        bundleName: summary.bundleName,
        value: pixTotal,
      });
      track("pix", { pixId: c.id });
      navigate({ to: "/pedido/$id", params: { id: c.id }, replace: true });
    },
  });

  const cardValid =
    luhnOk(card.number) &&
    card.name.trim().length >= 3 &&
    expOk(card.exp) &&
    digits(card.cvv).length >= 3;
  // Banco autenticando o cartão (3DS): a janela do banco pode abrir por cima do checkout.
  const [threeDS, setThreeDS] = useState(false);
  const cardMutation = useMutation({
    mutationFn: async () => {
      const address = structuredAddress();
      if (!cardKey || !address) throw new Error("Cartão indisponível no momento. Tente o Pix.");
      const [mm, yy] = card.exp.split("/");
      const cardHash = await tokenizeCard(
        cardKey,
        {
          number: digits(card.number),
          holderName: card.name.trim().toUpperCase(),
          expMonth: mm!,
          expYear: `20${yy}`,
          cvv: digits(card.cvv),
        },
        {
          amount: cardT.total,
          installments,
          customer: { name: id.name, email: id.email, phoneNumber: digits(id.phone) },
          address: {
            street: address.street,
            streetNumber: address.number,
            complement: address.complement || "Sem complemento",
            zipCode: address.zipcode,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            country: "BR",
          },
        },
        setThreeDS,
      ).catch((e) => {
        const reason = e instanceof Error && e.message ? `: ${e.message}` : "";
        throw new Error(
          `Não foi possível validar o cartão${reason}. Confira os dados e tente novamente.`,
        );
      });
      const adminPassword = adminPwd();
      const res = await cardFn({
        data: {
          ...orderPayload(),
          cardHash,
          installments,
          ...(adminPassword ? { adminPassword } : {}),
        },
      });
      return { ...res, cardHash };
    },
    onSuccess: (c) => {
      savePixSession({
        ...sessionBase(),
        id: c.id,
        qrcode: "",
        amount: c.amount,
        discount: 0,
        method: "card",
        installments,
        // Token do gateway (não é o cartão): permite o upsell no mesmo cartão sem redigitar.
        cardHash: c.cardHash,
      });
      metaTrack("AddPaymentInfo", { value: cardTotal, contentName: summary.bundleName });
      trackCheckoutClick({
        source: "card_submitted",
        bundleId: summary.bundleId,
        bundleName: summary.bundleName,
        value: cardTotal,
      });
      track("pix", { pixId: c.id });
      // A página do pedido confirma o pagamento no servidor e segue para o upsell/obrigado.
      navigate({ to: "/pedido/$id", params: { id: c.id }, replace: true });
    },
  });

  const submitId = (e: FormEvent) => {
    e.preventDefault();
    if (idValid) {
      track("dados");
      setStep(addrValid ? 3 : 2);
    }
  };
  const submitAddr = (e: FormEvent) => {
    e.preventDefault();
    if (addrValid) {
      track("entrega");
      setStep(3);
    }
  };

  const idCard =
    step === 1 ? (
      <Card>
        <CardHead
          title="Identificação"
          step="1 de 3"
          sub="Preencha seus dados para envio do pedido."
        />
        <form onSubmit={submitId} className="mt-6 space-y-4">
          <Field
            label="Nome completo"
            autoComplete="name"
            required
            value={id.name}
            ok={id.name.trim().split(" ").length >= 2}
            onChange={(e) => setId({ ...id, name: e.target.value })}
          />
          <Field
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            value={id.email}
            ok={emailOk(id.email)}
            onChange={(e) => setId({ ...id, email: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="CPF"
              inputMode="numeric"
              required
              value={id.cpf}
              ok={digits(id.cpf).length === 11}
              onChange={(e) => setId({ ...id, cpf: maskCpf(e.target.value) })}
            />
            <Field
              label="Celular / WhatsApp"
              prefix="+55"
              inputMode="tel"
              required
              value={id.phone}
              ok={digits(id.phone).length >= 10}
              onChange={(e) => setId({ ...id, phone: maskPhone(e.target.value) })}
            />
          </div>
          <PrimaryButton type="submit" disabled={!idValid}>
            Ir para entrega
          </PrimaryButton>
        </form>
      </Card>
    ) : (
      <Card done>
        <CardHead title="Identificação" done onEdit={() => setStep(1)} />
        <p className="mt-3 text-[13px] font-semibold">{id.name}</p>
        <p className="mt-1 text-[13px] text-mute">{id.email}</p>
        <p className="mt-1 text-[13px] text-mute">{id.phone}</p>
      </Card>
    );

  const addrCard =
    step === 2 ? (
      <Card>
        <CardHead title="Entrega" step="2 de 3" sub="Informe o endereço de entrega." />
        <form onSubmit={submitAddr} className="mt-6 space-y-4">
          <div className="flex items-end gap-4">
            <Field
              label="CEP"
              wrap="w-2/3"
              inputMode="numeric"
              required
              value={addr.cep}
              ok={digits(addr.cep).length === 8}
              onChange={(e) => setAddr({ ...addr, cep: maskCep(e.target.value) })}
            />
            {addr.uf && (
              <span className="pb-3.5 text-xs font-semibold text-mute">
                {addr.cidade}/{addr.uf}
              </span>
            )}
          </div>
          <Field
            label="Endereço"
            required
            value={addr.rua}
            ok={!!addr.rua}
            onChange={(e) => setAddr({ ...addr, rua: e.target.value })}
          />
          <div className="flex gap-3">
            <Field
              label="Nº"
              wrap="w-1/4"
              required
              value={addr.numero}
              ok={!!addr.numero}
              onChange={(e) => setAddr({ ...addr, numero: e.target.value })}
            />
            <Field
              label="Bairro"
              wrap="flex-1"
              required
              value={addr.bairro}
              ok={!!addr.bairro}
              onChange={(e) => setAddr({ ...addr, bairro: e.target.value })}
            />
          </div>
          <Field
            label={
              <>
                Complemento <span className="text-[11px] font-normal text-mute">(opcional)</span>
              </>
            }
            value={addr.complemento}
            onChange={(e) => setAddr({ ...addr, complemento: e.target.value })}
          />
          <p className="pt-2 text-sm font-bold">Escolha o frete</p>
          {FRETES.map(({ id: v, name: t, eta: d, price }) => {
            const locked = v === "gratis" && !freeEligible;
            const p = locked ? `Acima de ${brl(FREE_SHIPPING_MIN)}` : price ? brl(price) : "Grátis";
            return (
              <button
                key={v}
                type="button"
                disabled={locked}
                onClick={() => setFrete(v)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition",
                  frete === v ? "border-ink bg-bone/60" : "border-stone hover:border-ink/40",
                  locked && "cursor-not-allowed opacity-50",
                )}
              >
                <Radio on={frete === v} />
                <span className="flex-1">
                  <span className="block text-[14px] font-semibold">{t}</span>
                  <span className="text-[12px] text-mute">
                    {locked ? `Faltam ${brl(FREE_SHIPPING_MIN - products)} em produtos` : d}
                  </span>
                </span>
                <span className={cn("text-[14px] font-bold", !price && !locked && "text-pix")}>
                  {p}
                </span>
              </button>
            );
          })}
          <PrimaryButton type="submit" disabled={!addrValid}>
            Ir para pagamento
          </PrimaryButton>
        </form>
      </Card>
    ) : step === 3 ? (
      <Card done>
        <CardHead title="Entrega" done onEdit={() => setStep(2)} />
        <p className="mt-3 text-[13px]">
          {addr.rua}, {addr.numero}
          {addr.complemento && ` - ${addr.complemento}`}
        </p>
        <p className="mt-1 text-[13px] text-mute">
          {addr.bairro}, {addr.cidade}/{addr.uf} {addr.cep}
        </p>
        <p className="mt-4 text-[13px] font-semibold">Frete selecionado</p>
        <p className="text-[13px] text-mute">
          {freteOpt.name} — {freteValue ? brl(freteValue) : "Grátis"} · {freteOpt.eta}
        </p>
      </Card>
    ) : (
      <Card muted>
        <CardHead
          title="Entrega"
          step="2 de 3"
          sub="Preencha os dados pessoais para continuar."
          muted
        />
      </Card>
    );

  const payCard =
    step < 3 ? (
      <Card muted={step === 1}>
        <CardHead
          title="Pagamento"
          step="3 de 3"
          muted={step === 1}
          sub={
            step === 1
              ? "Preencha os dados de entrega para continuar."
              : "Todas as transações são seguras e criptografadas."
          }
        />
      </Card>
    ) : (
      <Card>
        <CardHead
          title="Pagamento"
          step="3 de 3"
          sub="Todas as transações são seguras e criptografadas."
        />
        <div className="mt-6 space-y-5">
          <div
            className={cn(
              "rounded-2xl border-2 transition",
              pay === "pix" ? "border-ink" : "border-stone",
            )}
          >
            <button
              type="button"
              onClick={() => setPay("pix")}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <Radio on={pay === "pix"} />
              <span className="grid h-9 w-9 place-items-center rounded-full bg-pix/10">
                <PixIcon className="h-5 w-5" />
              </span>
              <span className="flex-1 text-[15px] font-semibold">Pix</span>
              <span className="rounded-full bg-pix/10 px-2.5 py-1 text-[11px] font-bold uppercase text-pix">
                {pixDiscountOn ? `${Math.round(PIX_DISCOUNT * 100)}% OFF` : "Aprovação imediata"}
              </span>
            </button>
            {pay === "pix" && (
              <div className="space-y-4 px-4 pb-4">
                <p className="text-sm text-mute">
                  O código Pix expira em 30 minutos após finalizar a compra.
                </p>
                <p className="text-sm text-mute">
                  Valor no Pix: <b className="text-lg text-pix">{brl(pixTotal)}</b>{" "}
                  {pixT.discount > 0 && (
                    <span className="text-[12px]">(economia de {brl(pixT.discount / 100)})</span>
                  )}
                </p>
                {mutation.isError && (
                  <p role="alert" className="text-sm text-red-600">
                    Não foi possível gerar o Pix agora. Confira seus dados e tente novamente.
                  </p>
                )}
                <PrimaryButton
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Finalizar
                  compra
                </PrimaryButton>
              </div>
            )}
          </div>

          {cardEnabled && (
            <div
              className={cn(
                "rounded-2xl border-2 transition",
                pay === "card" ? "border-ink" : "border-stone",
              )}
            >
              <button
                type="button"
                onClick={() => setPay("card")}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <Radio on={pay === "card"} />
                <span className="grid h-9 w-9 place-items-center rounded-full bg-bone">
                  <CreditCard className="h-5 w-5 text-ink/70" />
                </span>
                <span className="flex-1 text-[15px] font-semibold">Cartão de crédito</span>
                <span className="text-[11px] font-bold uppercase text-mute">
                  até {CARD_MAX_INSTALLMENTS}x
                </span>
              </button>
              {pay === "card" && (
                <div className="space-y-4 px-4 pb-4">
                  <Field
                    label="Número do cartão"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={card.number}
                    ok={luhnOk(card.number)}
                    onChange={(e) => setCard({ ...card, number: maskCard(e.target.value) })}
                  />
                  <Field
                    label="Nome impresso no cartão"
                    autoComplete="cc-name"
                    value={card.name}
                    ok={card.name.trim().length >= 3}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <Field
                      label="Validade"
                      wrap="flex-1"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      value={card.exp}
                      ok={expOk(card.exp)}
                      onChange={(e) => setCard({ ...card, exp: maskExp(e.target.value) })}
                    />
                    <Field
                      label="CVV"
                      wrap="flex-1"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={card.cvv}
                      ok={digits(card.cvv).length >= 3}
                      onChange={(e) =>
                        setCard({ ...card, cvv: digits(e.target.value).slice(0, 4) })
                      }
                    />
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold">Parcelas</span>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="h-12 w-full rounded-xl border border-stone bg-white px-3 text-base outline-none focus-visible:border-ink md:text-sm"
                    >
                      {Array.from({ length: CARD_MAX_INSTALLMENTS }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n === 1
                            ? `1x de ${brl(cardTotal)} à vista`
                            : `${n}x de ${brl(cardTotal / n)} sem juros`}
                        </option>
                      ))}
                    </select>
                  </label>
                  {pixDiscountOn && (
                    <p className="rounded-xl bg-pix/10 px-3 py-2 text-[12px] text-ink/70">
                      No Pix sai por <b className="text-pix">{brl(pixTotal)}</b> (
                      {Math.round(PIX_DISCOUNT * 100)}% de desconto).{" "}
                      <button
                        type="button"
                        onClick={() => setPay("pix")}
                        className="font-semibold text-pix underline"
                      >
                        Pagar com Pix
                      </button>
                    </p>
                  )}
                  {cardMutation.isError && (
                    <p role="alert" className="text-sm text-red-600">
                      {cardMutation.error instanceof Error
                        ? cardMutation.error.message
                        : "Não foi possível processar o cartão."}
                    </p>
                  )}
                  <PrimaryButton
                    type="button"
                    disabled={!cardValid || !cardKey || cardMutation.isPending}
                    onClick={() => cardMutation.mutate()}
                  >
                    {cardMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}{" "}
                    {threeDS ? "Aguardando autenticação do banco…" : "Comprar agora"}
                  </PrimaryButton>
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-mute">
                    <Lock className="h-3 w-3" /> Os dados do cartão são criptografados e não ficam
                    salvos na loja.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );

  return (
    <div className="flex min-h-screen flex-col bg-bone font-sans text-ink">
      <CheckoutHeader />
      <SummaryMobile lines={lines} products={products} frete={freteValue} discount={discount} />
      <main className="mx-auto grid w-full max-w-[1160px] gap-4 px-3 pb-24 pt-6 md:px-4 lg:grid-cols-3">
        <div className="space-y-4">
          {idCard}
          {addrCard}
        </div>
        <div>{payCard}</div>
        <SummaryDesktop lines={lines} products={products} frete={freteValue} discount={discount} />
      </main>
      <CheckoutFooter />
    </div>
  );
}
