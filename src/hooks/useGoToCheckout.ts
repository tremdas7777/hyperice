import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { hasMind } from "@/lib/cart";
import { useShop } from "@/state/shop";

const SEEN_KEY = "mind-offer-seen";

/** O cliente já aceitou ou recusou a oferta nesta visita? */
export function wasMindOfferSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markMindOfferSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* armazenamento indisponível */
  }
}

/**
 * Leva ao checkout. Na primeira vez da visita, antes abre o popup da oferta do Nike Mind
 * (o popup decide para onde seguir quando o cliente aceita ou recusa).
 */
export function useGoToCheckout() {
  const navigate = useNavigate();
  const { cart, setMindOfferOpen } = useShop();
  return useCallback(() => {
    if (!wasMindOfferSeen() && !hasMind(cart)) {
      setMindOfferOpen(true);
      return;
    }
    navigate({ to: "/checkout" });
  }, [cart, navigate, setMindOfferOpen]);
}
