import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, CircleCheck, Loader2, ShieldCheck } from "lucide-react";
import { socks } from "@/data/store";
import { createCardFollowUpCharge, createUpsellCharge } from "@/lib/pix.functions";
import { loadPixSession, savePixSession, type PixSession } from "@/lib/pix-session";
import {
  SHIPPING_INSURANCE,
  SOCK_OFFERS,
  sockSizeFor,
  upsellSelection,
  type UpsellProduct,
} from "@/lib/upsell";
import { cn } from "@/lib/utils";
import { brl, PixIcon } from "@/components/checkout/parts";
import { Shell } from "@/components/checkout/OrderShell";

export const Route = createFileRoute("/upsell/$id")({
  head: () => ({
    meta: [{ title: "Oferta especial" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

const sockImage = (p: UpsellProduct) => SOCK_OFFERS.find((o) => o.product === p)?.color.image;

/**
 * Ofertas pós-compra: meia Nike (branca e/ou preta, pacote com 3 pares) e seguro de entrega.
 * O cliente marca o que quiser e paga tudo numa cobrança só. Depois (comprando ou não) vem a
 * página do envio expresso — ver /expresso. Cartão → no mesmo cartão (com o clique do cliente);
 * Pix → um Pix separado.
 */
function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<PixSession | null | undefined>(undefined);
  const createFn = useServerFn(createUpsellCharge);
  const cardFn = useServerFn(createCardFollowUpCharge);
  const [usePix, setUsePix] = useState(false);
  const [chosen, setChosen] = useState<UpsellProduct[]>([]);
  const [sockSize, setSockSize] = useState("M");

  useEffect(() => {
    const s = loadPixSession(id);
    // Sem sessão (outro dispositivo) ou já é um upsell: segue para o obrigado.
    if (!s || s.isUpsell) navigate({ to: "/obrigado/$id", params: { id }, replace: true });
    else {
      setSession(s);
      setSockSize(sockSizeFor(s.mainSize));
    }
  }, [id, navigate]);

  const sel = upsellSelection(chosen, sockSize);
  const socksChosen = chosen.some((p) => p.startsWith("meia-"));
  const isCard = session?.method === "card" && !!session.cardHash && !usePix;
  const toggle = (p: UpsellProduct) =>
    setChosen((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const mutation = useMutation({
    mutationFn: async () => {
      const offers = {
        parentId: id,
        origin: window.location.origin,
        products: sel.products,
        ...(socksChosen ? { sockSize } : {}),
      };
      if (isCard) {
        const r = await cardFn({ data: { ...offers, cardHash: session!.cardHash! } });
        return { ...r, qrcode: "", method: "card" as const };
      }
      const r = await createFn({ data: offers });
      return { ...r, method: "pix" as const };
    },
    onSuccess: (c) => {
      if (!session) return;
      savePixSession({
        method: c.method,
        id: c.id,
        qrcode: c.qrcode,
        amount: c.amount,
        email: session.email,
        name: session.name,
        bundleId: session.bundleId,
        bundleName: sel.label,
        lines: sel.items.map((i) => {
          const img = sockImage(i.product);
          return {
            title: i.label,
            detail: img
              ? "3 pares · vai junto com o seu pedido"
              : "Reenvio ou reembolso em caso de extravio ou dano",
            price: i.price,
            thumbs: img ? [img] : [],
          };
        }),
        productPrice: sel.total,
        frete: 0,
        discount: 0,
        createdAt: Date.now(),
        ...(session.phone ? { phone: session.phone } : {}),
        ...(session.cpf ? { cpf: session.cpf } : {}),
        ...(session.utm ? { utm: session.utm } : {}),
        fbp: session.fbp ?? null,
        fbc: session.fbc ?? null,
        isUpsell: true,
        parentId: id,
        upsellItems: sel.products,
      });
      navigate({ to: "/pedido/$id", params: { id: c.id }, replace: true });
    },
  });

  if (!session) {
    return (
      <Shell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-heat" />
        </div>
      </Shell>
    );
  }

  const firstName = session.name.trim().split(/\s+/)[0];
  const sockOff = Math.round((1 - socks.price / socks.compareAtPrice) * 100);
  const insured = chosen.includes("seguro");

  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-pix/10 px-4 py-3 text-[13px] font-semibold text-pix">
          <CircleCheck className="h-4 w-4 shrink-0" />
          Pagamento aprovado! Seu pedido está confirmado.
        </div>

        <p className="mt-8 text-center text-[12px] font-bold uppercase tracking-[0.2em] text-heat">
          Espere, {firstName}! Ofertas só para você
        </p>
        <h1 className="mt-2 text-center font-display text-4xl uppercase leading-[0.95] md:text-5xl">
          Complete o seu pedido
        </h1>
        <p className="mt-3 text-center text-[14px] text-mute">
          Marque o que quiser.{" "}
          {isCard
            ? "Cobramos no mesmo cartão da sua compra, sem digitar nada."
            : "Você paga tudo num Pix só, sem preencher nada de novo."}
        </p>

        {/* Meias: branca, preta ou as duas. */}
        <section className="mt-6 rounded-2xl border-2 border-stone bg-white p-4">
          <p className="inline-block rounded-full bg-heat px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            -{sockOff}% · só nesta tela
          </p>
          <h2 className="mt-2 text-[16px] font-semibold leading-snug">{socks.name}</h2>
          <p className="mt-0.5 text-[13px] text-mute">{socks.description}</p>

          <p className="mt-4 text-[13px] font-semibold">
            Marque a cor <span className="font-normal text-mute">(pode levar as duas)</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {SOCK_OFFERS.map(({ product, color }) => {
              const on = chosen.includes(product);
              return (
                <label
                  key={product}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-white transition",
                    on ? "border-pix" : "border-stone hover:border-ink/40",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(product)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-2.5 top-2.5 z-10 grid h-6 w-6 place-items-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-ink",
                      on ? "border-pix bg-pix text-white" : "border-stone bg-white",
                    )}
                  >
                    {on && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <img
                    src={color.image}
                    alt={`${socks.name} ${color.name}`}
                    loading="lazy"
                    className="aspect-square w-full bg-white object-contain p-2"
                  />
                  <span className="block border-t border-stone px-3 py-2.5">
                    <span className="block text-[13px] font-semibold">Meia {color.name}</span>
                    <span className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[11px] text-mute line-through">
                        {brl(socks.compareAtPrice)}
                      </span>
                      <span className="text-[17px] font-extrabold text-pix">
                        {brl(socks.price)}
                      </span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {socksChosen && (
            <div className="mt-4">
              <p className="text-[13px] font-semibold">
                Tamanho da meia{" "}
                <span className="font-normal text-mute">(sugerido pela sua numeração)</span>
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {socks.sizes.map((s) => {
                  const on = sockSize === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSockSize(s.id)}
                      className={cn(
                        "rounded-xl border-2 py-2 text-center transition",
                        on ? "border-ink bg-ink text-white" : "border-stone hover:border-ink",
                      )}
                    >
                      <span className="block text-[14px] font-bold leading-none">{s.id}</span>
                      <span
                        className={cn("mt-1 block text-[10px]", on ? "text-white/70" : "text-mute")}
                      >
                        {s.from} a {s.to}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Seguro de entrega. */}
        <label
          className={cn(
            "mt-4 block cursor-pointer rounded-2xl border-2 bg-white p-4 transition",
            insured ? "border-pix" : "border-stone hover:border-ink/40",
          )}
        >
          <div className="flex gap-3">
            <input
              type="checkbox"
              checked={insured}
              onChange={() => toggle("seguro")}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-pix)]"
            />
            <ShieldCheck className="mt-0.5 h-8 w-8 shrink-0 text-pix" />
            <div>
              <p className="text-[15px] font-semibold">{SHIPPING_INSURANCE.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mute">
                Se o seu pedido for extraviado ou chegar danificado, você escolhe:{" "}
                <b className="text-ink">reenviamos sem custo</b> ou{" "}
                <b className="text-ink">devolvemos o valor integral</b>.
              </p>
              <p className="mt-1 text-[20px] font-extrabold text-pix">
                {brl(SHIPPING_INSURANCE.price)}
              </p>
            </div>
          </div>
        </label>

        {mutation.isError &&
          (isCard ? (
            <p role="alert" className="mt-4 text-center text-sm text-red-600">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Não foi possível cobrar no mesmo cartão."}{" "}
              <button
                type="button"
                onClick={() => {
                  setUsePix(true);
                  mutation.reset();
                }}
                className="font-semibold underline"
              >
                Pagar com Pix
              </button>
            </p>
          ) : (
            <p role="alert" className="mt-4 text-center text-sm text-red-600">
              Não foi possível gerar o Pix agora. Tente novamente em alguns segundos.
            </p>
          ))}

        <button
          type="button"
          disabled={mutation.isPending || sel.products.length === 0}
          onClick={() => mutation.mutate()}
          className="mt-6 flex w-full flex-col items-center justify-center rounded-3xl bg-heat px-6 py-4 text-white shadow-lg transition hover:bg-heat-hover disabled:opacity-50"
        >
          <span className="flex items-center gap-2 text-[17px] font-bold uppercase tracking-wider">
            {mutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            Sim, adicionar ao pedido
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium opacity-90">
            {sel.products.length === 0 ? (
              "Marque uma oferta acima"
            ) : isCard ? (
              `${brl(sel.total)} no mesmo cartão, com 1 clique`
            ) : (
              <>
                <PixIcon className="h-3.5 w-3.5 text-white" />
                {brl(sel.total)} no Pix
              </>
            )}
          </span>
        </button>

        <Link
          to="/expresso/$id"
          params={{ id }}
          replace
          className="mt-4 block text-center text-[13px] text-mute underline"
        >
          Não, obrigado. Seguir sem as ofertas.
        </Link>
      </div>
    </Shell>
  );
}
