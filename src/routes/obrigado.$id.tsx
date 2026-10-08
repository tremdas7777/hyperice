import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Mail, PackageCheck, Truck } from "lucide-react";
import { loadPixSession, type PixSession } from "@/lib/pix-session";
import { brl } from "@/components/checkout/parts";
import { Pill, Shell } from "@/components/checkout/OrderShell";

export const Route = createFileRoute("/obrigado/$id")({
  head: () => ({
    meta: [{ title: "Pedido confirmado" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

/** Página de obrigado — no fim do pós-compra (seguro e envio expresso), comprando algo ou não. */
function Page() {
  const { id } = Route.useParams();
  // Lido só no navegador (sessionStorage) para não divergir da renderização do servidor.
  const [sessions, setSessions] = useState<{ main: PixSession | null; extras: PixSession[] }>({
    main: null,
    extras: [],
  });

  useEffect(() => {
    const s = loadPixSession(id);
    const main = s?.isUpsell ? (s.parentId ? loadPixSession(s.parentId) : null) : s;
    // Compras do pós-compra já pagas: seguro de entrega e envio expresso.
    const extras = main
      ? [main.upsellId, main.expressId]
          .map((x) => (x ? loadPixSession(x) : null))
          .filter((x): x is PixSession => !!x)
      : s?.isUpsell
        ? [s]
        : [];
    setSessions({ main, extras });
  }, [id]);

  const { main, extras } = sessions;
  const extra = extras.length > 0;
  const email = main?.email ?? extras[0]?.email;

  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20 text-center">
        <Pill variant="approved" />
        <div className="mx-auto mt-6 grid h-16 w-16 place-items-center rounded-full bg-pix text-white">
          <Check className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-display text-5xl uppercase leading-none">
          {extra ? "Compra adicional confirmada!" : "Pedido confirmado!"}
        </h1>
        <p className="mt-3 text-sm text-mute">
          {extra
            ? "Obrigado pela confiança! Sua compra adicional foi incluída no seu pedido."
            : "Obrigado pela compra! Seu pedido já está sendo preparado."}
          {email && (
            <>
              {" "}
              Os detalhes foram enviados para <b className="text-ink">{email}</b>.
            </>
          )}
        </p>

        {(main || extra) && (
          <div className="mt-8 rounded-2xl bg-white p-6 text-left shadow-[0_18px_40px_-24px_rgba(11,11,12,0.35)]">
            <h2 className="mb-4 font-display text-2xl uppercase">Resumo da compra</h2>
            <div className="space-y-4 text-[13px]">
              {main && (
                <div className="flex justify-between gap-3">
                  <div>
                    {main.lines.map((l, i) => (
                      <div key={i} className={i ? "mt-2" : ""}>
                        <p className="font-semibold">{l.title}</p>
                        <p className="mt-0.5 text-mute">{l.detail}</p>
                      </div>
                    ))}
                  </div>
                  <span className="shrink-0 font-semibold">{brl(main.amount / 100)}</span>
                </div>
              )}
              {extras.map((x) => (
                <div key={x.id} className="flex justify-between gap-3 border-t border-stone pt-4">
                  <div>
                    <p className="font-semibold">{x.bundleName}</p>
                    <p className="mt-0.5 text-mute">Incluído no seu pedido</p>
                  </div>
                  <span className="shrink-0 font-semibold">{brl(x.amount / 100)}</span>
                </div>
              ))}
              {main && extra && (
                <div className="flex justify-between border-t border-stone pt-3 text-base font-bold">
                  <span>Total pago</span>
                  <span>{brl((main.amount + extras.reduce((t, x) => t + x.amount, 0)) / 100)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-white/60 p-6 text-left">
          <h2 className="font-display text-2xl uppercase">Próximos passos</h2>
          <ol className="mt-4 space-y-4 text-[13.5px]">
            {[
              { icon: Mail, text: "Você recebe a confirmação do pedido no seu e-mail." },
              { icon: PackageCheck, text: "Separamos e embalamos tudo em um único envio." },
              { icon: Truck, text: "Assim que for despachado, você recebe o código de rastreio." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <Link
          to="/rastreio"
          className="mt-8 inline-block rounded-full bg-heat px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover"
        >
          Acompanhar meu pedido
        </Link>
        <p className="mt-3 text-[12px] text-mute">Pedido nº {id}</p>
      </div>
    </Shell>
  );
}
