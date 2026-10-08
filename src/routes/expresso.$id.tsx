import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CircleCheck, Loader2, Truck } from "lucide-react";
import { createCardFollowUpCharge, createUpsellCharge } from "@/lib/pix.functions";
import { loadPixSession, savePixSession, type PixSession } from "@/lib/pix-session";
import { EXPRESS_SHIPPING } from "@/lib/upsell";
import { brl } from "@/components/checkout/parts";
import { Shell } from "@/components/checkout/OrderShell";

export const Route = createFileRoute("/expresso/$id")({
  head: () => ({
    meta: [{ title: "Oferta especial" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

/**
 * Envio expresso: página própria depois da tela de ofertas (comprando ou não as ofertas).
 * `id` é o pedido principal. Compra no cartão → mesmo cartão (com o clique do cliente); Pix → Pix separado.
 */
function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<PixSession | null | undefined>(undefined);
  const createFn = useServerFn(createUpsellCharge);
  const cardFn = useServerFn(createCardFollowUpCharge);
  const [usePix, setUsePix] = useState(false);

  useEffect(() => {
    const s = loadPixSession(id);
    // Sem sessão (outro dispositivo) ou expresso já pago: segue para o obrigado.
    if (!s || s.isUpsell || s.expressId)
      navigate({ to: "/obrigado/$id", params: { id: s?.upsellId ?? id }, replace: true });
    else setSession(s);
  }, [id, navigate]);

  const isCard = session?.method === "card" && !!session.cardHash && !usePix;

  const mutation = useMutation({
    mutationFn: async () => {
      const offers = {
        parentId: id,
        origin: window.location.origin,
        products: ["expresso" as const],
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
        bundleName: EXPRESS_SHIPPING.name,
        lines: [
          {
            title: EXPRESS_SHIPPING.name,
            detail: "Seu pedido sai com prioridade",
            price: EXPRESS_SHIPPING.price,
            thumbs: [],
          },
        ],
        productPrice: EXPRESS_SHIPPING.price,
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
        upsellItems: ["expresso"],
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

  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-pix/10 px-4 py-3 text-[13px] font-semibold text-pix">
          <CircleCheck className="h-4 w-4 shrink-0" />
          {session.upsellId
            ? "Compra adicional aprovada! Já está no seu pedido."
            : "Pagamento aprovado! Seu pedido está confirmado."}
        </div>

        <p className="mt-8 text-center text-[12px] font-bold uppercase tracking-[0.2em] text-heat">
          Última oferta, {firstName}
        </p>
        <h1 className="mt-2 text-center font-display text-4xl uppercase leading-[0.95] md:text-5xl">
          Quer receber mais rápido?
        </h1>

        <div className="mt-6 rounded-2xl border-2 border-pix bg-white p-5">
          <div className="flex gap-4">
            <Truck className="mt-0.5 h-10 w-10 shrink-0 text-pix" />
            <div>
              <p className="text-[16px] font-semibold">{EXPRESS_SHIPPING.name}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-mute">
                Seu pedido sai na frente: <b className="text-ink">despachamos com prioridade</b>,
                por envio expresso, para chegar antes.
              </p>
              <p className="mt-2 text-[26px] font-extrabold text-pix">
                {brl(EXPRESS_SHIPPING.price)}
              </p>
            </div>
          </div>
        </div>

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
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Não foi possível gerar o Pix agora. Tente novamente em alguns segundos."}
            </p>
          ))}

        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="mt-6 flex w-full flex-col items-center justify-center rounded-3xl bg-heat px-6 py-4 text-white shadow-lg transition hover:bg-heat-hover disabled:opacity-70"
        >
          <span className="flex items-center gap-2 text-[17px] font-bold uppercase tracking-wider">
            {mutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            {isCard ? "Comprar com um clique" : "Gerar Pix"}
          </span>
          <span className="text-[13px] font-medium opacity-90">
            {brl(EXPRESS_SHIPPING.price)} {isCard ? "no mesmo cartão" : "no Pix"}
          </span>
        </button>

        <Link
          to="/obrigado/$id"
          params={{ id: session.upsellId ?? id }}
          replace
          className="mt-4 block text-center text-[13px] text-mute underline"
        >
          Não, obrigado. Pode enviar no prazo normal.
        </Link>
      </div>
    </Shell>
  );
}
