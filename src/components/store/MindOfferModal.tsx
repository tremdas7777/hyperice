import { useNavigate } from "@tanstack/react-router";
import { Check, Lock, RefreshCcw, Truck, X } from "lucide-react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useState } from "react";
import { mindSlide } from "@/data/store";
import { mindColorById, mindOfferPrice } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { metaTrack } from "@/lib/meta-pixel";
import { useShop } from "@/state/shop";

const ease = [0.22, 1, 0.36, 1] as const;
const MAX_PAIRS = Math.max(...mindSlide.offers.map((o) => o.pairs));

type PairChoice = { colorId: string; size: string | null };

/**
 * Popup ao clicar em comprar: oferece o Nike Mind 001 Slide (1 ou 2 pares) antes do checkout.
 * "Aproveitar oferta" coloca os pares escolhidos (cor + numeração) no pedido e segue;
 * "Recusar oferta" segue sem eles. O X só fecha.
 */
export function MindOfferModal() {
  const { mindOfferOpen, setMindOfferOpen, setMindItem } = useShop();
  const navigate = useNavigate();
  const [units, setUnits] = useState(1);
  const [pairs, setPairs] = useState<PairChoice[]>(() =>
    Array.from({ length: MAX_PAIRS }, () => ({ colorId: mindSlide.colors[0]!.id, size: null })),
  );
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);
  const [mobile, setMobile] = useState(true);
  const shake = useAnimationControls();

  const chosen = pairs.slice(0, units);
  const current = pairs[active] ?? pairs[0]!;
  const color = mindColorById(current.colorId);
  const price = mindOfferPrice(units);
  const compareAt = mindSlide.compareAtPrice * units;
  const off = Math.round((1 - price / compareAt) * 100);
  const missing = chosen.findIndex((p) => !p.size);

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

  const updatePair = (index: number, change: Partial<PairChoice>) =>
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, ...change } : p)));

  const chooseUnits = (n: number) => {
    setUnits(n);
    setError(false);
    if (active >= n) setActive(0);
  };

  const chooseSize = (s: string) => {
    updatePair(active, { size: s });
    setError(false);
    // Com 2 pares: escolheu a numeração do par 1 → já passa para o par 2.
    const next = pairs.findIndex((p, i) => i !== active && i < units && !p.size);
    if (next >= 0) setTimeout(() => setActive(next), 250);
  };

  const continueToCheckout = () => {
    setMindOfferOpen(false);
    navigate({ to: "/checkout" });
  };

  const accept = () => {
    if (missing >= 0) {
      setActive(missing);
      setError(true);
      shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    setMindItem({
      type: "mind",
      pairs: chosen.map((p) => ({ colorId: p.colorId, size: p.size! })),
      qty: 1,
    });
    metaTrack("AddToCart", { value: price, contentName: mindSlide.name });
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
            className="relative max-h-[94svh] w-full overflow-y-auto rounded-t-[28px] bg-white font-sans text-ink shadow-2xl md:grid md:max-h-[90vh] md:max-w-[960px] md:grid-cols-[1fr_1.05fr] md:overflow-hidden md:rounded-[28px]"
          >
            <button
              onClick={() => setMindOfferOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-bone"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Foto da cor do par em edição */}
            <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#ffffff,#eeebe5_75%)] px-6 pb-2 pt-6 md:p-10">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={off}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-full bg-heat text-center text-white shadow-lg md:left-6 md:top-6 md:h-20 md:w-20"
                >
                  <span className="font-display text-xl leading-none md:text-2xl">-{off}%</span>
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.img
                  key={color.id}
                  src={color.image}
                  alt={`${mindSlide.name} ${color.name}`}
                  initial={{ opacity: 0, x: 24, rotate: -4 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: -24, rotate: 4 }}
                  transition={{ duration: 0.35, ease }}
                  className="aspect-[5/3] w-[74%] max-w-[360px] scale-125 object-contain mix-blend-multiply md:aspect-square md:w-full"
                />
              </AnimatePresence>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-mute">
                {units > 1 ? `Par ${active + 1} · ` : ""}
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
                  className="mt-3 font-display text-[1.75rem] uppercase leading-[0.95] md:text-[2.4rem]"
                >
                  Leve também o {mindSlide.name}
                </h2>
                <p className="mt-2 hidden text-sm leading-relaxed text-mute md:block">
                  {mindSlide.description}
                </p>

                {/* Seletor de unidades */}
                <div
                  className="mt-4 grid grid-cols-2 gap-2.5"
                  role="radiogroup"
                  aria-label="Quantidade"
                >
                  {mindSlide.offers.map((o) => {
                    const on = units === o.pairs;
                    const best = o.pairs === MAX_PAIRS && o.pairs > 1;
                    return (
                      <button
                        key={o.pairs}
                        role="radio"
                        aria-checked={on}
                        onClick={() => chooseUnits(o.pairs)}
                        className={`relative flex flex-col items-start rounded-2xl border-2 px-3.5 py-3 text-left transition ${
                          on ? "border-ink bg-ink text-white" : "border-stone hover:border-ink"
                        }`}
                      >
                        {best && (
                          <span className="absolute -top-2.5 right-2.5 rounded-full bg-heat px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            Melhor oferta
                          </span>
                        )}
                        <span className="font-display text-xl uppercase leading-none">
                          {o.pairs} {o.pairs > 1 ? "pares" : "par"}
                        </span>
                        <span className="mt-1.5 text-lg font-extrabold leading-none">
                          {formatBRL(o.price)}
                        </span>
                        <span className={`mt-1 text-[11px] ${on ? "text-white/65" : "text-mute"}`}>
                          {o.pairs > 1
                            ? `${formatBRL(o.price / o.pairs)} cada`
                            : `de ${formatBRL(mindSlide.compareAtPrice)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-sm text-mute line-through">{formatBRL(compareAt)}</span>
                  <span className="text-3xl font-extrabold leading-none tracking-tight">
                    {formatBRL(price)}
                  </span>
                  <span className="rounded-full bg-pix/10 px-2.5 py-1 text-xs font-bold text-pix">
                    Economize {formatBRL(compareAt - price)}
                  </span>
                </div>

                {/* Abas dos pares (com 2 pares, cada um tem cor e numeração) */}
                {units > 1 && (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {chosen.map((p, i) => {
                      const on = i === active;
                      const bad = error && !p.size;
                      return (
                        <button
                          key={i}
                          onClick={() => setActive(i)}
                          className={`flex items-center gap-2 rounded-xl border-2 p-2 text-left transition ${
                            on ? "border-ink" : bad ? "border-red-300" : "border-stone"
                          }`}
                        >
                          <img
                            src={mindColorById(p.colorId).image}
                            alt=""
                            className="h-9 w-9 shrink-0 scale-125 rounded-lg bg-white object-contain"
                          />
                          <span className="min-w-0">
                            <span className="block text-[11px] font-bold uppercase tracking-wider">
                              Par {i + 1}
                            </span>
                            <span
                              className={`block truncate text-[11px] ${bad ? "text-red-600" : "text-mute"}`}
                            >
                              {p.size
                                ? `${mindColorById(p.colorId).name} · ${p.size}`
                                : "Escolher numeração"}
                            </span>
                          </span>
                          {p.size && <Check className="ml-auto h-4 w-4 shrink-0 text-pix" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cor */}
                <div className="mt-5">
                  <p className="text-sm font-semibold">
                    {units > 1 ? `Cor do par ${active + 1}: ` : "Cor: "}
                    <span className="font-normal text-mute">{color.name}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {mindSlide.colors.map((c) => {
                      const on = c.id === current.colorId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => updatePair(active, { colorId: c.id })}
                          aria-label={c.name}
                          aria-pressed={on}
                          title={c.name}
                          className={`relative aspect-square overflow-hidden rounded-xl bg-white transition ${
                            on
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
                          {on && (
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
                    className={`text-sm font-semibold ${error && !current.size ? "text-red-600" : ""}`}
                  >
                    {error && !current.size
                      ? `Escolha a numeração${units > 1 ? ` do par ${active + 1}` : ""}`
                      : `Numeração${units > 1 ? ` do par ${active + 1}` : ""} (BR)`}
                  </p>
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
                    {mindSlide.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => chooseSize(s)}
                        className={`rounded-lg border py-2 text-[13px] font-semibold transition ${
                          current.size === s
                            ? "border-ink bg-ink text-white"
                            : error && !current.size
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
                    + {formatBRL(price)} no seu pedido · {units} {units > 1 ? "pares" : "par"}
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
