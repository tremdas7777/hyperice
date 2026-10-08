import { useEffect, type RefObject } from "react";
import { product } from "@/data/store";
import { metaTrack } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/tracking";

/**
 * Loja de produto único: o produto fica na página inicial. A visualização conta quando a seção de
 * compra aparece na tela (funil do admin + ViewContent no Meta), uma vez por página.
 */
export function useTrackProductView(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        void trackEvent({
          event_type: "product_view",
          value: product.price,
          bundle_name: product.name,
        });
        metaTrack("ViewContent", { value: product.price, contentName: product.name });
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
