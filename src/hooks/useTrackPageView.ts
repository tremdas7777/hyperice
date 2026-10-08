import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackEvent } from "@/lib/tracking";

/** Visita de página. A visualização do produto é registrada pela seção de compra (useTrackProductView). */
export function useTrackPageView() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return;
    trackEvent({ event_type: "page_view", path: pathname });
  }, [pathname]);
}
