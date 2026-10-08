import { useState } from "react";
import { ChevronDown, Truck } from "lucide-react";
import { colorById } from "@/lib/cart";
import type { OrderLine } from "@/lib/order";
import { brl } from "./parts";

type Props = {
  lines: OrderLine[];
  /** Total dos produtos (com o order bump), em reais. */
  products: number;
  frete: number;
  discount: number;
};

const totalOf = ({ products, frete, discount }: Props) => products - discount + frete;

function Thumbs({ colorIds }: { colorIds: string[] }) {
  return (
    <div className="relative h-16 w-16 shrink-0">
      {colorIds.map((id, i) => (
        <img
          key={`${id}-${i}`}
          src={colorById(id).images[0].thumb}
          alt=""
          width={64}
          height={64}
          className={`absolute rounded-xl bg-photo object-cover ring-2 ring-white ${
            colorIds.length > 1
              ? i === 0
                ? "left-0 top-0 h-11 w-11"
                : "bottom-0 right-0 h-11 w-11"
              : "inset-0 h-full w-full"
          }`}
        />
      ))}
    </div>
  );
}

function Body(p: Props) {
  const { lines, products, frete, discount } = p;
  return (
    <>
      {frete === 0 && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-pix/10 px-4 py-3 text-[13px] text-pix">
          <Truck className="h-4 w-4 shrink-0" /> Você ganhou <b>FRETE GRÁTIS</b>
        </p>
      )}
      <ul className="space-y-4">
        {lines.map((l, i) => (
          <li key={`${l.title}-${i}`} className="flex gap-3">
            <Thumbs colorIds={l.colorIds} />
            <div className="flex-1 text-[13px]">
              <p className="font-semibold leading-tight">{l.title}</p>
              <p className="mt-1 text-mute">{l.detail}</p>
            </div>
            <span className="text-[13px] font-semibold">{brl(l.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-2 border-t border-stone pt-5 text-[13px]">
        <div className="flex justify-between">
          <span className="text-mute">Produtos</span>
          <span>{brl(products)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-mute">Frete</span>
          <span className={frete ? "" : "font-semibold text-pix"}>
            {frete ? brl(frete) : "Grátis"}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-mute">Desconto Pix</span>
            <span className="font-semibold text-pix">-{brl(discount)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-2">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-extrabold tracking-tight">{brl(totalOf(p))}</span>
        </div>
      </div>
    </>
  );
}

export function SummaryDesktop(p: Props) {
  return (
    <aside className="hidden h-fit rounded-2xl border border-ink/10 bg-white p-6 lg:sticky lg:top-6 lg:block">
      <h2 className="mb-5 font-display text-2xl uppercase">Resumo do pedido</h2>
      <Body {...p} />
    </aside>
  );
}

export function SummaryMobile(p: Props) {
  const [open, setOpen] = useState(false);
  const count = p.lines.length;
  return (
    <div className="border-b border-stone bg-white lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <span className="text-[13px] font-semibold">
          Resumo do pedido ({count} {count === 1 ? "item" : "itens"})
        </span>
        <span className="flex items-center gap-2 text-lg font-extrabold">
          {brl(totalOf(p))}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="border-t border-stone px-4 py-5">
          <Body {...p} />
        </div>
      )}
    </div>
  );
}
