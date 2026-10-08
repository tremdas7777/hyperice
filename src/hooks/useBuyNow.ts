import { useCallback } from "react";
import type { CartItem } from "@/lib/cart";
import { useShop } from "@/state/shop";

/**
 * Compra direta (sem sacola): começa o pedido com o item escolhido e abre o popup da oferta do
 * Nike Mind. O popup leva ao checkout quando o cliente aceita ou recusa.
 */
export function useBuyNow() {
  const { startPurchase, setMindOfferOpen } = useShop();
  return useCallback(
    (item: CartItem) => {
      startPurchase(item);
      setMindOfferOpen(true);
    },
    [startPurchase, setMindOfferOpen],
  );
}
