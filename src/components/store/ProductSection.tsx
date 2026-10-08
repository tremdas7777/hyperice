import {
  ChevronDown,
  Minus,
  Move3d,
  Plus,
  RefreshCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { colors, kit, product, sizes, soldOut } from "@/data/store";
import { colorById, kitSavings } from "@/lib/cart";
import { useNavigate } from "@tanstack/react-router";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useTrackProductView } from "@/hooks/useTrackProductView";
import { metaTrack } from "@/lib/meta-pixel";
import { itemTotal } from "@/lib/cart";
import { formatBRL, installment, pixPrice } from "@/lib/format";
import { useCurrentSelection, useSelectedColor, useShop } from "@/state/shop";
import { SizeGuideModal } from "./SizeGuideModal";
import { Eyebrow, ShineButton } from "./primitives";
import { SpinViewer } from "./SpinViewer";

const VIEW_360 = -1;
const NONE_SOLD_OUT: string[] = [];

function Gallery() {
  const color = useSelectedColor();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    scroller.current?.scrollTo({ left: 0 });
  }, [color.id]);

  const current = index === VIEW_360 ? null : color.images[index];

  return (
    <div className="lg:sticky lg:top-24">
      {/* Desktop */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[84px_1fr]">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setIndex(VIEW_360)}
            className={`grid aspect-square place-items-center rounded-xl bg-ink text-white transition ${
              index === VIEW_360 ? "ring-2 ring-heat ring-offset-2" : "opacity-80 hover:opacity-100"
            }`}
            aria-label="Ver em 360°"
          >
            <span className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              <Move3d className="h-5 w-5" />
              360°
            </span>
          </button>
          {color.images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setIndex(i)}
              className={`aspect-square overflow-hidden rounded-xl bg-photo transition ${
                index === i ? "ring-2 ring-ink ring-offset-2" : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`Foto ${i + 1}`}
            >
              <img src={img.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>

        <div
          className="relative aspect-square overflow-hidden rounded-3xl bg-photo"
          onMouseMove={(e) => {
            if (!current) return;
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
            });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <AnimatePresence mode="wait">
            {current ? (
              <motion.img
                key={current.src}
                src={current.src}
                alt={current.alt}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="h-full w-full cursor-zoom-in object-cover transition-transform duration-200"
                style={
                  zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : {}
                }
              />
            ) : (
              <motion.div
                key="360"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <SpinViewer color={color} className="absolute inset-0" />
                <span className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-mute">
                  <Move3d className="h-3.5 w-3.5" /> Arraste para girar
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile: carrossel com scroll-snap */}
      <div className="lg:hidden">
        <div
          ref={scroller}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {color.images.map((img, i) => (
            <div key={img.src} className="aspect-square w-full shrink-0 snap-center bg-photo">
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {color.images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${index === i ? "w-6 bg-ink" : "w-1.5 bg-ink/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone">
      <button
        className="flex w-full items-center justify-between py-5 text-left font-semibold"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-5 text-sm leading-relaxed text-mute">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SizeGrid({
  colorId,
  value,
  onChange,
  error,
}: {
  colorId: string;
  value: string | null;
  onChange: (size: string) => void;
  error: boolean;
}) {
  const unavailable = soldOut[colorId] ?? NONE_SOLD_OUT;
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {sizes.map((s) => {
        const out = unavailable.includes(s.br);
        const selected = value === s.br;
        return (
          <button
            key={s.br}
            disabled={out}
            onClick={() => onChange(s.br)}
            title={`US M ${s.usM} / W ${s.usW}`}
            className={`relative rounded-xl border py-3 text-sm font-semibold transition ${
              selected
                ? "border-ink bg-ink text-white"
                : out
                  ? "cursor-not-allowed border-stone text-mute/50 line-through"
                  : error
                    ? "border-red-300 hover:border-ink"
                    : "border-stone hover:border-ink"
            }`}
          >
            {s.br}
          </button>
        );
      })}
    </div>
  );
}

/** Escolha entre 1 par e o kit com as duas cores, dentro da área de tamanho. */
function OfferPicker() {
  const { offer, setOffer } = useShop();
  const options = [
    {
      id: "single" as const,
      title: "1 par",
      detail: "Escolha a cor",
      price: product.price,
      badge: null,
    },
    {
      id: "kit" as const,
      title: "2 pares",
      detail: "Escolha a cor de cada par",
      price: kit.price,
      badge: `Economize ${formatBRL(kitSavings)}`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Quantidade de pares">
      {options.map((o) => {
        const active = offer === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => setOffer(o.id)}
            className={`relative flex flex-col items-start rounded-2xl border-2 p-4 text-left transition ${
              active ? "border-ink bg-ink text-white" : "border-stone hover:border-ink"
            }`}
          >
            {o.badge && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-heat px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {o.badge}
              </span>
            )}
            <span className="font-display text-2xl uppercase leading-none">{o.title}</span>
            <span className={`mt-1 text-xs ${active ? "text-white/70" : "text-mute"}`}>
              {o.detail}
            </span>
            <span className="mt-3 text-lg font-extrabold">{formatBRL(o.price)}</span>
            {o.id === "kit" && (
              <span className={`text-xs ${active ? "text-white/60" : "text-mute"}`}>
                {formatBRL(kit.price / kit.pairs)} por par
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ProductSection() {
  const {
    offer,
    colorId,
    setColorId,
    size,
    setSize,
    kitPairs,
    setKitPair,
    addToCart,
    setCartOpen,
  } = useShop();
  const navigate = useNavigate();
  const { cardEnabled } = useStoreSettings();
  const sectionRef = useRef<HTMLElement>(null);
  useTrackProductView(sectionRef);
  const color = useSelectedColor();
  const [qty, setQty] = useState(1);
  const selection = useCurrentSelection(qty);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const shake = useAnimationControls();

  const unavailable = soldOut[colorId] ?? NONE_SOLD_OUT;
  const isKit = offer === "kit";
  const price = isKit ? kit.price : product.price;
  const compareAt = isKit ? product.price * kit.pairs : product.compareAtPrice;

  useEffect(() => {
    if (size && unavailable.includes(size)) setSize(null);
  }, [colorId, size, unavailable, setSize]);

  useEffect(() => {
    setSizeError(false);
  }, [offer]);

  const requireSelection = () => {
    if (selection) return selection;
    setSizeError(true);
    shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
    document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return null;
  };

  const add = () => {
    const item = requireSelection();
    if (!item) return null;
    addToCart(item);
    metaTrack("AddToCart", {
      value: itemTotal(item),
      contentName: item.type === "kit" ? kit.name : product.name,
    });
    return item;
  };

  const handleAdd = () => {
    if (add()) setCartOpen(true);
  };

  const handleBuyNow = () => {
    if (add()) navigate({ to: "/checkout" });
  };

  return (
    <section ref={sectionRef} id="comprar" className="scroll-mt-20 bg-white py-12 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <Gallery />

        <div>
          <Eyebrow className="text-mute">{product.brand}</Eyebrow>
          <h2 className="mt-3 font-display text-5xl uppercase leading-[0.95] sm:text-6xl">
            {product.name}
          </h2>
          <p className="mt-2 text-sm text-mute">
            {isKit
              ? `Chinelo de recuperação · ${kit.name}`
              : `Chinelo de recuperação · ${color.name} · Estilo ${color.style}`}
          </p>

          <div className="mt-6 rounded-2xl bg-bone p-5">
            <div className="flex items-baseline gap-3">
              {compareAt && (
                <span className="text-lg text-mute line-through">{formatBRL(compareAt)}</span>
              )}
              <span className="text-3xl font-extrabold tracking-tight">{formatBRL(price)}</span>
              {isKit && <span className="text-sm font-semibold text-heat">2 pares</span>}
            </div>
            {cardEnabled ? (
              <>
                <p className="mt-1 text-sm text-mute">
                  em até {product.installments}x de{" "}
                  <strong className="text-ink">{formatBRL(installment(price))}</strong> sem juros
                </p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-pix/10 px-3 py-1 text-sm font-semibold text-pix">
                  {formatBRL(pixPrice(price))} no Pix ({Math.round(product.pixDiscount * 100)}% off)
                </p>
              </>
            ) : (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-pix/10 px-3 py-1 text-sm font-semibold text-pix">
                À vista no Pix · frete grátis
              </p>
            )}
          </div>

          {/* Cor (no kit, as duas cores já estão incluídas) */}
          {!isKit && (
            <div className="mt-8">
              <span className="text-sm font-semibold">
                Cor: <span className="font-normal text-mute">{color.name}</span>
              </span>
              <div className="mt-3 flex gap-3">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColorId(c.id)}
                    aria-pressed={colorId === c.id}
                    aria-label={c.name}
                    className={`relative h-20 w-20 overflow-hidden rounded-2xl bg-photo transition ${
                      colorId === c.id
                        ? "ring-2 ring-ink ring-offset-2"
                        : "hover:ring-1 hover:ring-ink/30"
                    }`}
                  >
                    <img src={c.images[0].thumb} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantidade de pares + tamanho */}
          <motion.div id="size-picker" animate={shake} className="mt-8 scroll-mt-28">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Quantos pares?</span>
              <button
                onClick={() => setGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
              >
                <Ruler className="h-4 w-4" /> Guia de tamanhos
              </button>
            </div>
            <div className="mt-3">
              <OfferPicker />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {isKit ? (
                <motion.div
                  key="kit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 space-y-6"
                >
                  {kitPairs.map((pair, index) => {
                    const c = colorById(pair.colorId);
                    const missing = sizeError && !pair.size;
                    return (
                      <div key={index} className="rounded-2xl border border-stone p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-display text-xl uppercase">Par {index + 1}</span>
                          <span className="text-xs text-mute">
                            {c.name}
                            {pair.size && ` · BR ${pair.size}`}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold">Cor</p>
                        <div className="mt-2 flex gap-2">
                          {colors.map((opt) => {
                            const active = pair.colorId === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  // Numeração esgotada na nova cor: limpa para escolher de novo.
                                  const out = (soldOut[opt.id] ?? []).includes(pair.size ?? "");
                                  setKitPair(index, {
                                    colorId: opt.id,
                                    ...(out ? { size: null } : {}),
                                  });
                                  setColorId(opt.id);
                                }}
                                aria-pressed={active}
                                className={`flex items-center gap-2 rounded-xl border-2 py-1.5 pl-1.5 pr-3 text-xs font-semibold transition ${
                                  active
                                    ? "border-ink bg-ink text-white"
                                    : "border-stone hover:border-ink"
                                }`}
                              >
                                <img
                                  src={opt.images[0].thumb}
                                  alt=""
                                  className="h-9 w-9 rounded-lg bg-photo object-cover"
                                />
                                {opt.name}
                              </button>
                            );
                          })}
                        </div>
                        <p
                          className={`mt-4 text-sm font-semibold ${missing ? "text-red-600" : ""}`}
                        >
                          {missing ? `Escolha a numeração do par ${index + 1}` : "Numeração (BR)"}
                        </p>
                        <div className="mt-2">
                          <SizeGrid
                            colorId={pair.colorId}
                            value={pair.size}
                            onChange={(s) => {
                              setKitPair(index, { size: s });
                              setColorId(pair.colorId);
                            }}
                            error={missing}
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="single"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6"
                >
                  <span
                    className={`text-sm font-semibold ${sizeError && !size ? "text-red-600" : ""}`}
                  >
                    {sizeError && !size ? "Selecione um tamanho" : "Tamanho (BR)"}
                  </span>
                  <div className="mt-3">
                    <SizeGrid
                      colorId={colorId}
                      value={size}
                      onChange={(s) => {
                        setSize(s);
                        setSizeError(false);
                      }}
                      error={sizeError && !size}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          {/* Quantidade + botões */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-stone">
              <button
                className="p-3.5 transition hover:text-heat disabled:opacity-30"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-semibold tabular-nums">{qty}</span>
              <button
                className="p-3.5 transition hover:text-heat disabled:opacity-30"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                disabled={qty >= 10}
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ShineButton id="buy-now" onClick={handleBuyNow} className="flex-1">
              Comprar agora
            </ShineButton>
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink py-3.5 text-sm font-bold uppercase tracking-wider transition hover:bg-ink hover:text-white"
          >
            <ShoppingBag className="h-4 w-4" /> Adicionar à sacola
          </button>

          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: Truck, text: "Frete grátis para todo o Brasil" },
              { icon: Zap, text: "Envio em até 2 dias úteis" },
              { icon: ShieldCheck, text: "Pagamento 100% seguro" },
              { icon: RefreshCcw, text: "Troca fácil em 7 dias" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 rounded-xl bg-bone p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-heat" />
                <span className="leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-stone">
            <Accordion title="Descrição" defaultOpen>
              {product.description}
            </Accordion>
            <Accordion title="Tecnologia e especificações">
              <ul className="list-disc space-y-1.5 pl-5">
                {product.specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Envio e trocas">
              <ul className="space-y-1.5">
                {product.shipping.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Accordion>
          </div>
        </div>
      </div>
      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </section>
  );
}
