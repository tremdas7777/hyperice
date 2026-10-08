import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { editorial, steps } from "@/data/store";
import { Eyebrow, Reveal, SplitTitle } from "./primitives";

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const line = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="como-funciona" className="scroll-mt-16 bg-bone py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal className="relative order-2 aspect-[4/5] overflow-hidden rounded-3xl lg:order-1">
          <img
            src={editorial.strap}
            alt="Detalhe do pod encaixado na tira"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <motion.div
            className="absolute left-6 top-6 rounded-full bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Ciclos de 15 min
          </motion.div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Eyebrow className="text-mute">Como funciona</Eyebrow>
          <SplitTitle
            text={"Três passos para\npés renovados."}
            className="mt-4 font-display text-[clamp(2.6rem,5.5vw,4.5rem)] uppercase leading-[0.92]"
          />

          <div ref={ref} className="relative mt-10 pl-10">
            <div className="absolute bottom-2 left-[15px] top-2 w-px bg-ink/10">
              <motion.div style={{ height: line }} className="w-full bg-heat" />
            </div>
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.12} className="relative pb-10 last:pb-0">
                <span className="absolute -left-10 top-0 grid h-8 w-8 place-items-center rounded-full bg-ink text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="font-display text-3xl uppercase">{s.title}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-mute">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
