import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { getPixStatus } from "@/lib/pix.functions";
import { metaPurchaseBrowser } from "@/lib/meta-pixel";
import { loadPixSession, savePixSession, type PixSession } from "@/lib/pix-session";
import { trackCheckoutClick } from "@/lib/analytics";
import { useShop } from "@/state/shop";
import { brl, PixIcon } from "@/components/checkout/parts";
import { Pill, Shell } from "@/components/checkout/OrderShell";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [{ title: "Pedido" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

const EXPIRES_MS = 30 * 60 * 1000;

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  ttq?: { track: (event: string, data?: Record<string, unknown>) => void };
};

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { clearCart } = useShop();
  // Lido só no navegador (sessionStorage) para não divergir da renderização do servidor.
  const [session, setSession] = useState<PixSession | null | undefined>(undefined);
  useEffect(() => setSession(loadPixSession(id)), [id]);
  const statusFn = useServerFn(getPixStatus);

  const { data } = useQuery({
    queryKey: ["pix-status", id],
    queryFn: () =>
      statusFn({
        data: {
          id,
          report: {
            fbp: session?.fbp ?? null,
            fbc: session?.fbc ?? null,
            url: window.location.href,
          },
        },
      }),
    refetchInterval: (q) => (q.state.data?.paid ? false : 5000),
    enabled: !!id && session !== undefined,
  });

  const status = data?.status ?? "waiting_payment";
  // "paid" vem do servidor (regra única em src/lib/pix-status.ts) — o navegador não decide.
  const paid = data?.paid === true;
  const refused = [
    "failed",
    "refused",
    "canceled",
    "cancelled",
    "chargedback",
    "refunded",
  ].includes(status);

  // Dispara os eventos de compra uma única vez quando o pagamento cai.
  useEffect(() => {
    if (!paid) return;
    const value = (session?.amount ?? 0) / 100;
    const w = window as DataLayerWindow;
    try {
      metaPurchaseBrowser(id, value, session?.bundleName);
      w.ttq?.track("CompletePayment", { value, currency: "BRL" });
      w.dataLayer?.push({ event: "purchase", currency: "BRL", value });
    } catch {
      // pixels indisponíveis
    }
    if (session) {
      trackCheckoutClick({
        source: "pix_paid",
        bundleId: session.bundleId,
        bundleName: session.bundleName,
        value,
      });
    }
    // Pedido principal pago: limpa o pedido em andamento.
    if (session && !session.isUpsell) clearCart();
    // Pedido principal pago → oferta do seguro; seguro pago → página do envio expresso;
    // envio expresso pago (ou sem sessão) → obrigado.
    if (session && !session.isUpsell)
      navigate({ to: "/upsell/$id", params: { id }, replace: true });
    else if (session?.isUpsell && session.parentId) {
      const express = !!session.upsellItems?.includes("expresso");
      const main = loadPixSession(session.parentId);
      if (main) savePixSession({ ...main, ...(express ? { expressId: id } : { upsellId: id }) });
      if (!express && main)
        navigate({ to: "/expresso/$id", params: { id: session.parentId }, replace: true });
      else navigate({ to: "/obrigado/$id", params: { id }, replace: true });
    } else navigate({ to: "/obrigado/$id", params: { id }, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  if (paid || session === undefined)
    return (
      <Shell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-heat" />
        </div>
      </Shell>
    );
  if (refused) return <Refused />;
  if (session?.method === "card" || id.startsWith("hc_")) return <WaitingCard session={session} />;
  return <WaitingPix session={session} />;
}

/** Tela "Quase lá..." enquanto o Pix não cai. */
function WaitingPix({ session }: { session: PixSession | null }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  // Começa como null para o HTML do servidor e a primeira renderização do
  // navegador serem idênticas (evita erro de hidratação na contagem regressiva).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!session?.qrcode) return;
    QRCode.toDataURL(session.qrcode, { margin: 1, width: 440, color: { dark: "#0b0b0c" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [session?.qrcode]);

  const remaining = useMemo(() => {
    if (!session || now === null) return EXPIRES_MS;
    return Math.max(0, EXPIRES_MS - (now - session.createdAt));
  }, [now, session]);

  const mmss = `${String(Math.floor(remaining / 60000)).padStart(2, "0")}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")}`;

  const copy = async () => {
    if (!session?.qrcode) return;
    await navigator.clipboard.writeText(session.qrcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20 text-center">
        <h1 className="font-display text-5xl uppercase leading-none">Quase lá...</h1>
        <p className="mt-3 text-sm text-mute">
          Pague via Pix em até <b className="text-ink">{mmss}</b> para confirmar seu pedido.
        </p>
        <div className="mt-4">
          <Pill variant="waiting" />
        </div>

        {session ? (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-[0_18px_40px_-24px_rgba(11,11,12,0.35)]">
            <div className="mx-auto grid h-[220px] w-[220px] place-items-center rounded-2xl border border-stone bg-white">
              {qr ? (
                <img
                  src={qr}
                  alt="QR Code do Pix"
                  width={220}
                  height={220}
                  className="h-[210px] w-[210px]"
                />
              ) : (
                <PixIcon className="h-16 w-16" />
              )}
            </div>
            <p className="mt-3 text-[12px] text-mute">
              Escaneie com o app do seu banco ou copie o código
            </p>
            <p className="mt-4 text-sm text-mute">
              Total via Pix: <b className="text-lg text-pix">{brl(session.amount / 100)}</b>
            </p>
            <div className="mt-4 max-h-24 overflow-y-auto break-all rounded-xl bg-bone px-4 py-3 text-left font-mono text-[11px] text-mute">
              {session.qrcode}
            </div>
            <button
              type="button"
              onClick={copy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-pix px-6 py-4 text-[15px] font-bold uppercase tracking-wider text-white transition hover:opacity-90"
            >
              <Copy className="h-4 w-4" /> {copied ? "Código copiado!" : "Copiar código Pix"}
            </button>

            <div className="mt-8 text-left">
              <h2 className="font-display text-2xl uppercase">Como pagar</h2>
              <ol className="mt-4 space-y-3">
                {[
                  <>
                    Toque em <b>copiar código Pix</b>, logo acima
                  </>,
                  <>
                    Abra o <b>aplicativo</b> do seu banco
                  </>,
                  <>
                    Escolha <b>Pix</b> e depois <b>"Pix Copia e Cola"</b>
                  </>,
                  <>Cole o código e confirme o pagamento</>,
                ].map((t, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-bone px-4 py-3 text-[13px] text-mute">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-heat" /> Assim que o
                pagamento cair, esta página avança sozinha.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-stone bg-white p-6 text-sm text-mute">
            <p className="font-semibold text-ink">
              Sessão do Pix não encontrada neste dispositivo.
            </p>
            <p className="mt-2">
              Estamos acompanhando seu pagamento. Assim que for confirmado, esta página se atualiza
              sozinha.
            </p>
            <Link to="/checkout" className="mt-4 inline-block font-semibold text-heat underline">
              Voltar ao checkout
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}

/** Cartão em análise pelo banco/antifraude: a página atualiza sozinha quando aprovar. */
function WaitingCard({ session }: { session: PixSession | null }) {
  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20 text-center">
        <h1 className="font-display text-5xl uppercase leading-none">Processando...</h1>
        <p className="mt-3 text-sm text-mute">
          Seu cartão está sendo analisado pelo banco. Isso costuma levar poucos segundos — não feche
          esta página.
        </p>
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-heat" />
        </div>
        {session && (
          <p className="text-sm text-mute">
            Total no cartão: <b className="text-[15px] text-ink">{brl(session.amount / 100)}</b>
            {session.installments && session.installments > 1 ? ` em ${session.installments}x` : ""}
          </p>
        )}
      </div>
    </Shell>
  );
}

function Refused() {
  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20 text-center">
        <Pill variant="refused" />
        <h1 className="mt-6 font-display text-4xl uppercase">Pagamento não aprovado</h1>
        <p className="mt-2 text-sm text-mute">Confira os dados informados para o pagamento.</p>
        <Link
          to="/checkout"
          className="mt-6 inline-block rounded-full bg-heat px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover"
        >
          Revisar dados
        </Link>
      </div>
    </Shell>
  );
}
