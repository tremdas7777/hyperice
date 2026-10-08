import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { kit, product } from "@/data/store";
import { colorById } from "@/lib/cart";
import { formatBRL, installment } from "@/lib/format";
import { isFreeShippingEligible } from "@/lib/shipping";
import { useBuyNow } from "@/hooks/useBuyNow";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCurrentSelection, useSelectedColor, useShop } from "@/state/shop";

/** Barra fixa que aparece fora do hero e da seção de compra. */
export function StickyBuyBar() {
  const color = useSelectedColor();
  const { offer, size, kitPairs } = useShop();
  const buyNow = useBuyNow();
  const selection = useCurrentSelection();
  const { cardEnabled } = useStoreSettings();
  const isKit = offer === "kit";
  const price = isKit ? kit.price : product.price;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const buy = document.getElementById("comprar");
    const hero = document.querySelector("main > section");
    const footer = document.querySelector("footer");
    if (!buy || !hero || !footer) return;
    const state = { buy: true, hero: true, footer: false };
    const update = () => setVisible(!state.buy && !state.hero && !state.footer);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === buy) state.buy = e.isIntersecting;
        if (e.target === hero) state.hero = e.isIntersecting;
        if (e.target === footer) state.footer = e.isIntersecting;
      }
      update();
    });
    io.observe(buy);
    io.observe(hero);
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const onBuy = () => {
    if (!selection) {
      document
        .getElementById("size-picker")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Compra direta: segue para o checkout passando pelo popup da oferta.
    buyNow(selection);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "120%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="fixed inset-x-0 bottom-0 z-30 p-3 sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[560px] sm:-translate-x-1/2 sm:p-0"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-ink/95 p-2.5 pr-3 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex shrink-0 -space-x-4">
              {(isKit ? kitPairs.map((p) => colorById(p.colorId)) : [color]).map((c, i) => (
                <img
                  key={`${c.id}-${i}`}
                  src={c.images[0].thumb}
                  alt=""
                  className="h-12 w-12 rounded-xl bg-photo object-cover ring-2 ring-ink"
                />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {isKit ? kit.short : `${product.short} · ${color.name}`}
              </p>
              <p className="truncate text-xs text-white/60">
                {formatBRL(price)}
                {cardEnabled
                  ? ` · ${product.installments}x ${formatBRL(installment(price))}`
                  : isFreeShippingEligible(price)
                    ? " · frete grátis"
                    : ""}
              </p>
            </div>
            <button
              onClick={onBuy}
              className="shrink-0 rounded-full bg-heat px-5 py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-heat-hover"
            >
              {selection ? (isKit ? "Comprar kit" : `Comprar · ${size}`) : "Escolher tamanho"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
