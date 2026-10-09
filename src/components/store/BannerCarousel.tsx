import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { banners } from "@/data/store";
import { scrollToId } from "@/lib/format";

const DURATION = 6500;
const ease = [0.22, 1, 0.36, 1] as const;

export function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  // Fora da tela o carrossel fica parado (não troca slide nem baixa foto à toa).
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "200px" });

  const go = useCallback((next: number) => {
    setDirection(next > 0 ? 1 : -1);
    setIndex((i) => (i + next + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    if (paused || !inView) return;
    const t = setTimeout(() => go(1), DURATION);
    return () => clearTimeout(t);
  }, [index, paused, inView, go]);

  // Deixa a foto do próximo slide pronta antes da troca.
  useEffect(() => {
    if (!inView) return;
    const next = banners[(index + 1) % banners.length];
    if (next) new Image().src = next.image;
  }, [index, inView]);

  const slide = banners[index];
  if (!slide) return null;

  return (
    <section
      ref={ref}
      className="relative h-[78svh] min-h-[520px] overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={{
            enter: (d: number) => ({ clipPath: d > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }),
            center: { clipPath: "inset(0 0 0 0%)" },
            exit: { opacity: 1 },
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 1, ease }}
          className="absolute inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(1);
            else if (info.offset.x > 60) go(-1);
          }}
        >
          <img
            src={slide.image}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full animate-kenburns object-cover"
          />
          <div
            className={`absolute inset-0 ${
              slide.dark
                ? "bg-gradient-to-r from-black/75 via-black/30 to-transparent max-sm:bg-gradient-to-t max-sm:from-black/85 max-sm:via-black/40"
                : slide.align === "right"
                  ? "bg-gradient-to-l from-white/80 via-white/30 to-transparent max-sm:bg-gradient-to-t max-sm:from-white/95 max-sm:via-white/60"
                  : "bg-gradient-to-r from-white/85 via-white/35 to-transparent max-sm:bg-gradient-to-t max-sm:from-white/95 max-sm:via-white/60"
            }`}
          />

          <div
            className={`relative mx-auto flex h-full max-w-7xl items-end px-4 pb-24 sm:items-center sm:px-6 sm:pb-0 ${
              slide.align === "right" ? "justify-end text-right" : ""
            } ${slide.dark ? "text-white" : "text-ink"}`}
          >
            <div className="max-w-xl">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="inline-block rounded-full bg-heat px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
              >
                {slide.eyebrow}
              </motion.span>
              <h2 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] uppercase leading-[0.9]">
                {slide.title.split("\n").map((line, i) => (
                  <span key={i} className="-mt-[0.2em] block overflow-hidden pt-[0.2em]">
                    <motion.span
                      className="block"
                      initial={{ y: "105%" }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.6 + i * 0.12, duration: 0.9, ease }}
                    >
                      {line}
                    </motion.span>
                  </span>
                ))}
              </h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95, duration: 0.6 }}
                className={`mt-4 text-base leading-relaxed sm:text-lg ${slide.dark ? "text-white/75" : "text-ink/70"} ${
                  slide.align === "right" ? "ml-auto" : ""
                } max-w-md`}
              >
                {slide.text}
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                onClick={() => scrollToId("comprar")}
                className={`mt-7 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wider transition ${
                  slide.dark
                    ? "bg-white text-ink hover:bg-heat hover:text-white"
                    : "bg-ink text-white hover:bg-heat"
                }`}
              >
                Quero o meu
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controles + barras de progresso */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 pb-6 sm:px-6">
          <div className="flex flex-1 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.title}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/30"
                aria-label={`Banner ${i + 1}`}
              >
                {i < index && <span className="absolute inset-0 bg-white" />}
                {i === index && (
                  <motion.span
                    key={`${index}-${paused}`}
                    className="absolute inset-y-0 left-0 bg-white"
                    initial={{ width: paused ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => go(-1)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white hover:text-ink"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white hover:text-ink"
              aria-label="Próximo banner"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
