import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { hasMind } from "@/lib/cart";
import { useShop } from "@/state/shop";

/**
 * Leva ao checkout. Toda compra passa antes pelo popup da oferta do Nike Mind, a não ser que o
 * slide já esteja na sacola (o popup decide para onde seguir quando o cliente aceita ou recusa).
 */
export function useGoToCheckout() {
  const navigate = useNavigate();
  const { cart, setMindOfferOpen } = useShop();
  return useCallback(() => {
    if (!hasMind(cart)) {
      setMindOfferOpen(true);
      return;
    }
    navigate({ to: "/checkout" });
  }, [cart, navigate, setMindOfferOpen]);
}
