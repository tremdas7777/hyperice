import { useNavigate } from "@tanstack/react-router";
import { Check, Lock, RefreshCcw, Truck, X } from "lucide-react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useState } from "react";
import { mindSlide } from "@/data/store";
import { markMindOfferSeen } from "@/hooks/useGoToCheckout";
import { mindColorById } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { metaTrack } from "@/lib/meta-pixel";
import { useShop } from "@/state/shop";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Popup ao clicar em comprar: oferece o Nike Mind 001 Slide por um preço especial antes do
 * checkout. "Aproveitar oferta" coloca o slide (cor + numeração) na sacola e segue; "Recusar" só segue.
 */
export function MindOfferModal() {
  const { mindOfferOpen, setMindOfferOpen, addToCart } = useShop();
  const navigate = useNavigate();
  const [colorId, setColorId] = useState(mindSlide.colors[0]!.id);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [mobile, setMobile] = useState(true);
  const shake = useAnimationControls();

  const color = mindColorById(colorId);
  const savings = mindSlide.compareAtPrice - mindSlide.price;
  const off = Math.round((savings / mindSlide.compareAtPrice) * 100);

  useEffect(() => {
    setMobile(!window.matchMedia("(min-width: 768px)").matches);
  }, [mindOfferOpen]);

  useEffect(() => {
    if (!mindOfferOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMindOfferOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mindOfferOpen, setMindOfferOpen]);

  const continueToCheckout = () => {
    markMindOfferSeen();
    setMindOfferOpen(false);
    navigate({ to: "/checkout" });
  };

  const accept = () => {
    if (!size) {
      setSizeError(true);
      shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    addToCart({ type: "mind", colorId, size, qty: 1 });
    metaTrack("AddToCart", { value: mindSlide.price, contentName: mindSlide.name });
    continueToCheckout();
  };

  return (
    <AnimatePresence>
      {mindOfferOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMindOfferOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mind-offer-title"
            initial={mobile ? { y: "100%" } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={mobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={mobile ? { y: "100%" } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.45, ease }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[94svh] w-full overflow-y-auto rounded-t-[28px] bg-white font-sans text-ink shadow-2xl md:grid md:max-h-[90vh] md:max-w-[920px] md:grid-cols-[1.05fr_1fr] md:overflow-hidden md:rounded-[28px]"
          >
            <button
              onClick={() => setMindOfferOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-bone"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Foto da cor escolhida */}
            <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#ffffff,#eeebe5_75%)] px-6 pb-2 pt-6 md:p-10">
              <span className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-full bg-heat text-center text-white shadow-lg md:left-6 md:top-6 md:h-20 md:w-20">
                <span className="font-display text-xl leading-none md:text-2xl">-{off}%</span>
              </span>
              <AnimatePresence mode="wait">
                <motion.img
                  key={color.id}
                  src={color.image}
                  alt={`${mindSlide.name} ${color.name}`}
                  initial={{ opacity: 0, x: 24, rotate: -4 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: -24, rotate: 4 }}
                  transition={{ duration: 0.35, ease }}
                  className="aspect-[5/3] w-[78%] max-w-[360px] scale-125 object-contain mix-blend-multiply md:aspect-square md:w-full"
                />
              </AnimatePresence>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-mute">
                {color.name}
              </p>
            </div>

            {/* Oferta */}
            <div className="flex flex-col md:max-h-[90vh] md:overflow-y-auto">
              <div className="flex-1 px-5 pt-5 md:px-8 md:pt-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-heat/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-heat">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-heat" />
                  Oferta exclusiva · só neste pedido
                </span>
                <h2
                  id="mind-offer-title"
                  className="mt-3 font-display text-[1.75rem] uppercase leading-[0.95] md:text-[2.6rem]"
                >
                  Leve também o {mindSlide.name}
                </h2>
                <p className="mt-2 hidden text-sm leading-relaxed text-mute md:block">
                  {mindSlide.description}
                </p>

                <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1 md:mt-4">
                  <span className="text-sm text-mute line-through">
                    {formatBRL(mindSlide.compareAtPrice)}
                  </span>
                  <span className="text-4xl font-extrabold leading-none tracking-tight">
                    {formatBRL(mindSlide.price)}
                  </span>
                  <span className="rounded-full bg-pix/10 px-2.5 py-1 text-xs font-bold text-pix">
                    Economize {formatBRL(savings)}
                  </span>
                </div>

                {/* Cor */}
                <div className="mt-5 md:mt-6">
                  <p className="text-sm font-semibold">
                    Cor: <span className="font-normal text-mute">{color.name}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {mindSlide.colors.map((c) => {
                      const active = c.id === colorId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setColorId(c.id)}
                          aria-label={c.name}
                          aria-pressed={active}
                          title={c.name}
                          className={`relative aspect-square overflow-hidden rounded-xl bg-white transition ${
                            active
                              ? "ring-2 ring-ink ring-offset-1"
                              : "ring-1 ring-stone hover:ring-ink/40"
                          }`}
                        >
                          <img
                            src={c.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full scale-150 object-contain"
                          />
                          {active && (
                            <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-ink text-white">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Numeração */}
                <motion.div animate={shake} className="mt-5">
                  <p
                    className={`text-sm font-semibold ${sizeError && !size ? "text-red-600" : ""}`}
                  >
                    {sizeError && !size ? "Escolha a numeração para aproveitar" : "Numeração (BR)"}
                  </p>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {mindSlide.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSize(s);
                          setSizeError(false);
                        }}
                        className={`rounded-lg border py-2 text-[13px] font-semibold transition ${
                          size === s
                            ? "border-ink bg-ink text-white"
                            : sizeError
                              ? "border-red-300 hover:border-ink"
                              : "border-stone hover:border-ink"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>

                <ul className="mt-5 grid grid-cols-2 gap-2 text-[12px] text-ink/70">
                  <li className="flex items-center gap-2 rounded-xl bg-bone px-3 py-2">
                    <Truck className="h-4 w-4 shrink-0 text-heat" /> Mesma caixa, sem frete extra
                  </li>
                  <li className="flex items-center gap-2 rounded-xl bg-bone px-3 py-2">
                    <RefreshCcw className="h-4 w-4 shrink-0 text-heat" /> Troca fácil em 7 dias
                  </li>
                </ul>
              </div>

              {/* Ações: fixas no rodapé da gaveta no celular */}
              <div className="sticky bottom-0 mt-5 border-t border-stone bg-white px-5 pb-5 pt-4 md:px-8 md:pb-8">
                <button
                  onClick={accept}
                  className="group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-heat px-6 py-3.5 text-white shadow-lg transition hover:bg-heat-hover active:scale-[0.99]"
                >
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  <span className="relative text-[16px] font-bold uppercase tracking-wider">
                    Aproveitar oferta
                  </span>
                  <span className="relative text-[12px] font-medium opacity-90">
                    + {formatBRL(mindSlide.price)} no seu pedido
                  </span>
                </button>
                <button
                  onClick={continueToCheckout}
                  className="mt-2 w-full rounded-2xl py-3 text-sm font-semibold text-mute transition hover:bg-bone hover:text-ink"
                >
                  Recusar oferta
                </button>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-mute">
                  <Lock className="h-3 w-3" /> Você revisa tudo no checkout antes de pagar
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
