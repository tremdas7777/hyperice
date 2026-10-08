import { ArrowDown, Flame, Move3d, Waves, Wind } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { colors, product } from "@/data/store";
import { scrollToId } from "@/lib/format";
import { useSelectedColor, useShop } from "@/state/shop";
import { Eyebrow, ShineButton, SplitTitle } from "./primitives";
import { SpinViewer } from "./SpinViewer";

const chips = [
  { icon: Flame, label: "Calor até 47 °C", className: "left-[4%] top-[18%]", delay: 1.1 },
  { icon: Waves, label: "3 níveis de massagem", className: "right-[2%] top-[34%]", delay: 1.3 },
  { icon: Wind, label: "Air Zoom total", className: "left-[10%] bottom-[16%]", delay: 1.5 },
];

const particles = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + ((i * 53) % 84)}%`,
  delay: `${(i * 0.37) % 4.5}s`,
  size: 4 + ((i * 7) % 8),
}));

export function Hero() {
  const { colorId, setColorId } = useShop();
  const color = useSelectedColor();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -10% 0px" });

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-ink text-white">
      {/* Brilho de "calor" animado */}
      <div className="pointer-events-none absolute left-[70%] top-1/2 -z-10 h-[90vmin] w-[90vmin] animate-glow rounded-full bg-[radial-gradient(circle,rgba(255,90,31,0.55)_0%,rgba(255,90,31,0.12)_45%,transparent_70%)] blur-2xl max-lg:left-1/2 max-lg:top-[68%]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* Texto gigante rolando ao fundo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[6%] -z-10 select-none overflow-hidden opacity-[0.07]">
        <div className="flex w-max animate-marquee font-display text-[22vw] leading-none uppercase [--marquee-duration:40s]">
          <span className="pr-[4vw]">Hyperslide • Recovery •</span>
          <span className="pr-[4vw]" aria-hidden>
            Hyperslide • Recovery •
          </span>
        </div>
      </div>

      <div className="mx-auto grid min-h-[calc(100svh-6rem)] max-w-7xl items-center gap-6 px-4 pb-12 pt-2 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-4">
        <div className="relative z-10 max-lg:text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Eyebrow className="text-white/70">{product.brand} · Lançamento</Eyebrow>
          </motion.div>

          <SplitTitle
            as="h1"
            immediate
            delay={0.15}
            text={"Recuperação\nque você\ncalça."}
            className="mt-5 font-display text-[clamp(3.2rem,9vw,7.5rem)] uppercase leading-[0.9] tracking-tight"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="mt-6 max-w-md text-base leading-relaxed text-white/70 max-lg:mx-auto sm:text-lg"
          >
            Nike Air Zoom Hyperslide: calor, massagem e amortecimento Air Zoom em um só chinelo. Seu
            pós-treino começa nos pés.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
            className="mt-8 flex flex-wrap gap-3 max-lg:justify-center"
          >
            <ShineButton onClick={() => scrollToId("comprar")}>Comprar agora</ShineButton>
            <button
              onClick={() => scrollToId("tecnologia")}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-sm font-bold uppercase tracking-wider transition hover:border-white hover:bg-white hover:text-ink"
            >
              Ver tecnologia
            </button>
          </motion.div>
        </div>

        {/* Chinelo girando 360° */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[50svh] min-h-[320px] max-lg:order-first lg:h-[74vh]"
        >
          {/* partículas de calor (atrás do palco) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[18%] h-10">
            {particles.map((p, i) => (
              <span
                key={i}
                className="absolute bottom-0 animate-rise rounded-full bg-heat-2/70 blur-[2px]"
                style={{ left: p.left, animationDelay: p.delay, width: p.size, height: p.size }}
              />
            ))}
          </div>

          {/* Palco: o vídeo 360° do produto real dentro de um "spotlight" */}
          <div className="absolute left-1/2 top-[45%] aspect-square h-[88%] max-w-full -translate-x-1/2 -translate-y-1/2">
            <div className="absolute -inset-[2%] animate-[spin_14s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,90,31,0.6)_70deg,transparent_140deg,transparent_360deg)] [mask:radial-gradient(circle_closest-side,transparent_97%,#000_98%,#000_100%,transparent_100%)]" />
            <SpinViewer
              color={color}
              active={inView}
              className="absolute inset-0 [mask-image:radial-gradient(circle_closest-side,#000_48%,rgba(0,0,0,0.55)_72%,transparent_96%)]"
              mediaClassName="brightness-[0.94]"
            />
          </div>

          {chips.map(({ icon: Icon, label, className, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { delay, duration: 0.6 },
                y: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
              className={`pointer-events-none absolute hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold backdrop-blur-md sm:flex ${className}`}
            >
              <Icon className="h-3.5 w-3.5 text-heat" />
              {label}
            </motion.div>
          ))}

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColorId(c.id)}
                  aria-pressed={colorId === c.id}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    colorId === c.id ? "bg-white text-ink" : "text-white/70 hover:text-white"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20"
                    style={{ background: c.swatch }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-white/45">
              <Move3d className="h-3.5 w-3.5" /> Arraste para girar
            </span>
          </div>
        </motion.div>
      </div>

      <button
        onClick={() => scrollToId("comprar")}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-white/40 transition hover:text-white lg:block"
        aria-label="Rolar para a compra"
      >
        <ArrowDown className="h-5 w-5 animate-bounce" />
      </button>
    </section>
  );
}
