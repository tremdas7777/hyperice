import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { MindOfferModal } from "@/components/store/MindOfferModal";
import { WhatsAppFloat } from "@/components/store/WhatsAppFloat";
import { useAntiCopy } from "@/hooks/useAntiCopy";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { useTrackPageView } from "@/hooks/useTrackPageView";
import { getPublicTracking } from "@/lib/site-settings.functions";
import { ShopProvider } from "@/state/shop";

type PixelIds = {
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  utmifyPixelId: string | null;
};

/**
 * Pixels no <head>, com os IDs cadastrados no /admin (nada fixo no código). Fora do /admin.
 * Meta: sem PageView aqui — o app envia o PageView com event_id, igual ao da API de Conversões.
 */
function pixelScripts(ids: PixelIds | undefined) {
  const scripts: { type: string; children: string }[] = [];
  const q = (v: string) => JSON.stringify(v);
  const skipAdmin = `if(location.pathname.indexOf("/admin")===0)return;`;
  if (ids?.metaPixelId) {
    const id = q(ids.metaPixelId);
    scripts.push({
      type: "text/javascript",
      children: `(function(){${skipAdmin}!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${id});window.__metaHeadPixel=${id};})();`,
    });
  }
  if (ids?.tiktokPixelId) {
    scripts.push({
      type: "text/javascript",
      children: `(function(){${skipAdmin}!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=d.createElement("script"),n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load(${q(ids.tiktokPixelId)});ttq.page()}(window,document,'ttq');})();`,
    });
  }
  if (ids?.utmifyPixelId) {
    scripts.push({
      type: "text/javascript",
      children: `(function(){${skipAdmin}if(document.querySelector('script[src*="cdn.utmify.com.br/scripts/pixel/pixel.js"]'))return;window.pixelId=${q(ids.utmifyPixelId)};var s=document.createElement("script");s.async=true;s.defer=true;s.src="https://cdn.utmify.com.br/scripts/pixel/pixel.js";(document.head||document.documentElement).appendChild(s);})();`,
    });
  }
  return scripts;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // IDs dos pixels (públicos) lidos uma vez por visita. Sem banco/servidor, a loja abre sem pixels.
  loader: () =>
    getPublicTracking().catch((): PixelIds => ({
      metaPixelId: null,
      tiktokPixelId: null,
      utmifyPixelId: null,
    })),
  staleTime: Infinity,
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nike Air Zoom Hyperslide — Chinelo de recuperação com calor e massagem" },
      {
        name: "description",
        content:
          "Nike x Hyperice Air Zoom Hyperslide: chinelo de recuperação com pod de calor e massagem e amortecimento Air Zoom. Preto e Orewood Brown. Frete grátis, 12x sem juros e 5% off no Pix.",
      },
      { name: "theme-color", content: "#0b0b0c" },
      { property: "og:title", content: "Nike Air Zoom Hyperslide" },
      {
        property: "og:description",
        content: "Chinelo de recuperação com calor, massagem e amortecimento Air Zoom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index,follow" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://static.nike.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
    scripts: pixelScripts(loaderData),
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const ids = Route.useLoaderData();
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {ids?.metaPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(ids.metaPixelId)}&ev=PageView&noscript=1`}
            />
          </noscript>
        )}
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteEffects />
      {/* O pedido em andamento é compartilhado entre a loja e o checkout. */}
      <ShopProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        {/* Oferta do Nike Mind ao clicar em comprar (antes do checkout). */}
        <MindOfferModal />
      </ShopProvider>
      <WhatsAppFloat />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

/** Rastreio de visitas, pixel do Meta e proteção contra cópia (dentro do QueryClientProvider). */
function SiteEffects() {
  useAntiCopy();
  useTrackPageView();
  useMetaPixel();
  return null;
}
