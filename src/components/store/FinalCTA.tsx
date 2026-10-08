import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { editorial, kit, product } from "@/data/store";
import { formatBRL, installment, scrollToId } from "@/lib/format";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { ShineButton, SplitTitle } from "./primitives";

export function FinalCTA() {
  const { cardEnabled } = useStoreSettings();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-ink py-28 text-white sm:py-40"
    >
      <motion.img
        src={editorial.heroGlow}
        alt=""
        style={{ y, scale }}
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
        loading="lazy"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/50 to-ink/70" />
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <SplitTitle
          text={"Seu pós-treino\ncomeça nos pés."}
          className="font-display text-[clamp(3rem,8vw,7rem)] uppercase leading-[0.9]"
        />
        <p className="mx-auto mt-6 max-w-lg text-lg text-white/70">
          {product.name} por {formatBRL(product.price)}
          {cardEnabled
            ? ` ou ${product.installments}x de ${formatBRL(installment(product.price))} sem juros`
            : ""}
          . Ou leve as duas cores no kit por {formatBRL(kit.price)}. Frete grátis.
        </p>
        <ShineButton onClick={() => scrollToId("comprar")} className="mt-10 px-10 py-5 text-base">
          Garantir o meu
        </ShineButton>
      </div>
    </section>
  );
}
