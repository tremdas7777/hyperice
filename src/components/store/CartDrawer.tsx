import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { product } from "@/data/store";
import { cartTotal, describeItem, itemKey, itemName, itemThumbs, itemTotal } from "@/lib/cart";
import { useGoToCheckout } from "@/hooks/useGoToCheckout";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { trackCheckoutClick } from "@/lib/analytics";
import { orderSummary } from "@/lib/order";
import { formatBRL, installment, pixPrice, scrollToId } from "@/lib/format";
import { useShop } from "@/state/shop";
import { ShineButton } from "./primitives";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, removeFromCart } = useShop();
  const goToCheckout = useGoToCheckout();
  const { cardEnabled } = useStoreSettings();
  const subtotal = cartTotal(cart);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, setCartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Sacola"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-stone px-5 py-4">
              <h2 className="font-display text-2xl uppercase">Sua sacola</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full p-2 hover:bg-bone"
                aria-label="Fechar sacola"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-pix/10 px-5 py-3 text-sm font-semibold text-pix">
              <Truck className="h-4 w-4" /> Você ganhou frete grátis!
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-bone">
                    <ShoppingBag className="h-7 w-7 text-mute" />
                  </span>
                  <p className="text-mute">Sua sacola está vazia.</p>
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      scrollToId("comprar");
                    }}
                    className="rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
                  >
                    Escolher meu Hyperslide
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => {
                      const key = itemKey(item);
                      const thumbs = itemThumbs(item);
                      return (
                        <motion.li
                          key={key}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30, height: 0 }}
                          className="flex gap-4"
                        >
                          <div className="relative h-24 w-24 shrink-0">
                            {thumbs.map((src, i) => (
                              <img
                                key={`${src}-${i}`}
                                src={src}
                                alt=""
                                className={`absolute rounded-2xl bg-photo object-cover ring-2 ring-white ${
                                  thumbs.length > 1
                                    ? i === 0
                                      ? "left-0 top-0 h-16 w-16"
                                      : "bottom-0 right-0 h-16 w-16"
                                    : "inset-0 h-full w-full"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold leading-tight">{itemName(item)}</p>
                                {describeItem(item).map((line, i) => (
                                  <p key={i} className="mt-1 text-sm text-mute">
                                    {line}
                                  </p>
                                ))}
                              </div>
                              <button
                                onClick={() => removeFromCart(key)}
                                className="rounded-full p-1.5 text-mute hover:bg-bone hover:text-ink"
                                aria-label="Remover item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center rounded-full border border-stone">
                                <button
                                  className="p-2"
                                  onClick={() => updateQty(key, item.qty - 1)}
                                  aria-label="Diminuir"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-5 text-center text-sm font-semibold tabular-nums">
                                  {item.qty}
                                </span>
                                <button
                                  className="p-2 disabled:opacity-30"
                                  disabled={item.qty >= (item.type === "mind" ? 1 : 10)}
                                  onClick={() => updateQty(key, item.qty + 1)}
                                  aria-label="Aumentar"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="font-bold">{formatBRL(itemTotal(item))}</span>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-stone px-5 py-5">
                <div className="flex items-center justify-between text-sm text-mute">
                  <span>Frete</span>
                  <span className="font-semibold text-pix">Grátis</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-extrabold">{formatBRL(subtotal)}</span>
                </div>
                {cardEnabled && (
                  <p className="mt-1 text-right text-xs text-mute">
                    {product.installments}x de {formatBRL(installment(subtotal))} ou{" "}
                    <strong className="text-pix">{formatBRL(pixPrice(subtotal))} no Pix</strong>
                  </p>
                )}
                <ShineButton
                  className="mt-4 w-full"
                  onClick={() => {
                    const s = orderSummary(cart);
                    trackCheckoutClick({
                      source: "cart_drawer",
                      bundleId: s.bundleId,
                      bundleName: s.bundleName,
                      value: subtotal,
                    });
                    setCartOpen(false);
                    goToCheckout();
                  }}
                >
                  Finalizar compra
                </ShineButton>
                <button
                  onClick={() => setCartOpen(false)}
                  className="mt-2 w-full py-2 text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
