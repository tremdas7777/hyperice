import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { colors, kit } from "@/data/store";
import { kitSavings } from "@/lib/cart";
import { formatBRL, scrollToId } from "@/lib/format";
import { useShop } from "@/state/shop";
import { Eyebrow, SplitTitle } from "./primitives";

const backgrounds: Record<string, string> = {
  preto: "bg-photo text-ink",
  orewood: "bg-photo text-ink",
};

export function ColorShowcase() {
  const { setColorId, setOffer } = useShop();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <Eyebrow className="text-mute">Duas cores, um produto</Eyebrow>
          <SplitTitle
            text="Escolha a sua."
            className="mt-4 font-display text-[clamp(2.8rem,6vw,5rem)] uppercase leading-[0.92]"
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 md:h-[560px] md:flex-row">
          {colors.map((c) => {
            const grow = hover === null ? 1 : hover === c.id ? 1.6 : 0.8;
            return (
              <motion.button
                key={c.id}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  setOffer("single");
                  setColorId(c.id);
                  scrollToId("comprar");
                }}
                animate={{ flexGrow: grow }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
                className={`group relative flex min-h-[380px] basis-0 flex-col justify-between overflow-hidden rounded-3xl p-7 text-left ${backgrounds[c.id] ?? "bg-bone"}`}
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
                    Estilo {c.style}
                  </span>
                  <h3 className="mt-1 font-display text-4xl uppercase sm:text-5xl">{c.name}</h3>
                </div>
                <img
                  src={c.images[0].src}
                  alt={`Hyperslide ${c.name}`}
                  loading="lazy"
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[78%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                />
                <span className="relative inline-flex items-center gap-2 self-start rounded-full bg-heat px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition group-hover:gap-3">
                  Escolher {c.name} <ArrowRight className="h-4 w-4" />
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Oferta do kit */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="relative mt-4 flex flex-col items-start gap-5 overflow-hidden rounded-3xl bg-ink p-7 text-white sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-heat/30 blur-3xl" />
          <div className="relative">
            <span className="rounded-full bg-heat px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
              Economize {formatBRL(kitSavings)}
            </span>
            <h3 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">
              Leve 2 pares por {formatBRL(kit.price)}
            </h3>
            <p className="mt-2 text-sm text-white/65">
              Você escolhe a cor e a numeração de cada par — dois iguais ou um de cada.
            </p>
          </div>
          <button
            onClick={() => {
              setOffer("kit");
              scrollToId("comprar");
            }}
            className="relative inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-ink transition hover:bg-heat hover:text-white"
          >
            Quero o kit <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
