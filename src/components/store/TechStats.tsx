import { animate, motion, useInView, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { editorial, stats } from "@/data/store";
import { Eyebrow, Reveal, SplitTitle } from "./primitives";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);
  return (
    <span ref={ref} className="tabular-nums">
      {display}
      <span className="ml-1 text-[0.45em] align-top text-heat">{suffix}</span>
    </span>
  );
}

export function TechStats() {
  const imgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: imgRef, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section id="tecnologia" className="scroll-mt-16 bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-end gap-8 lg:grid-cols-2">
          <div>
            <Eyebrow className="text-white/60">Nike x Hyperice</Eyebrow>
            <SplitTitle
              text={"Tecnologia que\ntrabalha enquanto\nvocê descansa."}
              className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.92]"
            />
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-md text-lg leading-relaxed text-white/65 lg:ml-auto">
              Um pod magnético removível na tira entrega calor e vibração direcionados no peito do
              pé, enquanto o Air Zoom de comprimento total amortece cada passo.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/10 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="bg-ink p-6 sm:p-8">
              <div className="font-display text-6xl sm:text-7xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-sm uppercase tracking-wider text-white/55">{s.label}</p>
            </Reveal>
          ))}
        </div>

        <div ref={imgRef} className="mt-16 grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink-2">
            <motion.img
              style={{ y: y1 }}
              src={editorial.sole}
              alt="Solado com amortecimento Air Zoom"
              className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24">
              <h3 className="font-display text-3xl uppercase">Air Zoom de ponta a ponta</h3>
              <p className="mt-1 text-sm text-white/70">
                Pisada macia e responsiva para usar o dia todo.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink-2 sm:mt-16">
            <motion.img
              style={{ y: y2 }}
              src={editorial.podOnStrap}
              alt="Pod magnético na tira do chinelo"
              className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24">
              <h3 className="font-display text-3xl uppercase">Pod magnético</h3>
              <p className="mt-1 text-sm text-white/70">
                Calor e vibração no peito do pé, controle no pod ou no app.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
