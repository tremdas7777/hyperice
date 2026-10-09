const SESSION_KEY = "store_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const UTM_KEYS = [
  "src",
  "sck",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;
const UTM_STORE = "store_utms";

/** Guarda as UTMs da primeira visita com UTM (localStorage) para enviá-las na venda. */
export function getStoredUtms(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const fromUrl: Record<string, string | null> = {};
  for (const k of UTM_KEYS) {
    const v = p.get(k);
    if (v) fromUrl[k] = v.slice(0, 300);
  }
  try {
    if (Object.keys(fromUrl).length) {
      localStorage.setItem(UTM_STORE, JSON.stringify(fromUrl));
      return fromUrl;
    }
    const raw = localStorage.getItem(UTM_STORE);
    return raw ? (JSON.parse(raw) as Record<string, string | null>) : {};
  } catch {
    return fromUrl;
  }
}

function getUtmParams() {
  const u = getStoredUtms();
  return {
    utm_source: u["utm_source"] ?? null,
    utm_medium: u["utm_medium"] ?? null,
    utm_campaign: u["utm_campaign"] ?? null,
  };
}

export type FunnelEventInput = {
  event_type: "page_view" | "product_view" | "checkout_click";
  path?: string;
  bundle_id?: string;
  bundle_name?: string;
  value?: number;
  metadata?: Record<string, unknown>;
};

/**
 * Grava o evento direto na API do banco (o mesmo POST que o cliente do Supabase faria, com a chave
 * pública e a permissão de insert do anon). Assim o visitante não baixa a biblioteca do Supabase
 * (~200 KB) só para contar visitas. `keepalive` garante o envio mesmo se a página mudar em seguida.
 */
async function insertFunnelEvent(row: Record<string, unknown>) {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
  if (!url || !key) return;
  // Chaves novas (sb_publishable_…) vão só no apikey; as antigas (JWT) também no Authorization.
  const jwtKey = !key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_");
  const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/funnel_events`, {
    method: "POST",
    keepalive: true,
    headers: {
      apikey: key,
      ...(jwtKey ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`funnel_events ${res.status}`);
}

export async function trackEvent(input: FunnelEventInput) {
  if (typeof window === "undefined") return;
  try {
    const utm = getUtmParams();
    const row = {
      session_id: getSessionId(),
      event_type: input.event_type,
      path: input.path ?? window.location.pathname,
      bundle_id: input.bundle_id ?? null,
      bundle_name: input.bundle_name ?? null,
      value: input.value ?? null,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      metadata: input.metadata ?? null,
    };
    await insertFunnelEvent(row);
  } catch (e) {
    console.warn("trackEvent failed", e);
  }
}
