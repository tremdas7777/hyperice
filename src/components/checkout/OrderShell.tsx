import type { ReactNode } from "react";
import { CheckoutFooter, CheckoutHeader } from "./parts";

/** Layout das páginas pós-checkout (pedido, upsell, expresso, obrigado). */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bone font-sans text-ink">
      <CheckoutHeader back={false} />
      <main className="flex-1 pt-8">{children}</main>
      <CheckoutFooter />
    </div>
  );
}

export function Pill({ variant }: { variant: "waiting" | "approved" | "refused" }) {
  const map = {
    waiting: { text: "Aguardando pagamento", cls: "bg-heat/10 text-heat" },
    approved: { text: "Aprovado", cls: "bg-pix/10 text-pix" },
    refused: { text: "Pagamento não aprovado", cls: "bg-red-100 text-red-700" },
  } as const;
  const v = map[variant];
  return (
    <span
      className={`inline-block rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-wider ${v.cls}`}
    >
      {v.text}
    </span>
  );
}
