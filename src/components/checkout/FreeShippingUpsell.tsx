import { useState } from "react";
import { Truck } from "lucide-react";
import { colors, defaultColor, kit, product } from "@/data/store";
import { itemPairs } from "@/lib/cart";
import { FREE_SHIPPING_MIN } from "@/lib/shipping";
import { cn } from "@/lib/utils";
import { useShop } from "@/state/shop";
import { brl } from "./parts";

/**
 * Oferta no checkout: se o pedido ainda não alcança o frete grátis (R$ 180 em produtos),
 * sugere fechar o kit de 2 pares. O botão cobra o valor real do 2º par (a diferença até
 * os R$ 197 do kit), nunca o simples "quanto falta" para o frete. A 2ª unidade vem na
 * mesma numeração do 1º par; a cor é escolhida aqui. Some ao atingir o mínimo.
 */
export function FreeShippingUpsell({ products }: { products: number }) {
  const { cart, upgradeToKit, showToast } = useShop();
  const [colorId, setColorId] = useState(defaultColor.id);
  const [added, setAdded] = useState(false);

  const missing = FREE_SHIPPING_MIN - products;
  const toKit = kit.price - products;
  const first = cart.flatMap(itemPairs)[0];
  if (missing <= 0 || !first || added) return null;

  const add = () => {
    upgradeToKit([
      { colorId: first.colorId, size: first.size },
      { colorId, size: first.size },
    ]);
    setAdded(true);
    showToast("2º par adicionado — frete grátis liberado!");
  };

  return (
    <section className="rounded-2xl border-2 border-pix/40 bg-pix/5 p-5">
      <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-pix">
        <Truck className="h-4 w-4 shrink-0" /> Falta pouco para o frete grátis
      </p>
      <p className="mt-2 text-[13px] text-ink/80">
        Faltam <b>{brl(missing)}</b> para o frete grátis. Leve <b>mais 1 {product.short}</b>{" "}
        (mesma numeração, BR {first.size}) e os <b>2 pares saem por {brl(kit.price)}</b> já com{" "}
        <b>frete grátis</b>:
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[12px] font-semibold text-mute">Cor:</span>
        {colors.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setColorId(c.id)}
            aria-label={c.name}
            title={c.name}
            className={cn(
              "h-8 w-8 rounded-full ring-2 ring-offset-2 transition",
              colorId === c.id ? "ring-ink" : "ring-transparent hover:ring-ink/30",
            )}
            style={{ backgroundColor: c.swatch }}
          />
        ))}
        <span className="text-[12px] font-semibold">
          {colors.find((c) => c.id === colorId)?.name}
        </span>
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-pix px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90"
      >
        Adicionar 2º par por {brl(toKit)} e ganhar frete grátis
      </button>
    </section>
  );
}
