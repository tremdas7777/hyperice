import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const KEYS = ["whatsapp_enabled", "card_enabled", "tiktok_pixel_id", "utmify_pixel_id"] as const;

async function readSettings() {
  const { data } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", [...KEYS]);
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  const str = (k: string) => {
    const v = map.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  return {
    whatsappEnabled: map.get("whatsapp_enabled") === true,
    // Cartão começa desligado; só aparece para os clientes depois de ativado no admin.
    cardEnabled: map.get("card_enabled") === true,
    // IDs públicos dos pixels (TikTok e UTMify), cadastrados no admin.
    tiktokPixelId: str("tiktok_pixel_id"),
    utmifyPixelId: str("utmify_pixel_id"),
  };
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(() => readSettings());

export const setCardEnabled = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ password: z.string().min(1).max(200), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.password !== process.env["ADMIN_PASSWORD"]) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "card_enabled", value: data.enabled, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });

export const setWhatsappEnabled = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ password: z.string().min(1).max(200), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.password !== process.env["ADMIN_PASSWORD"]) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings").upsert({
      key: "whatsapp_enabled",
      value: data.enabled,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });

/** IDs públicos do pixel do TikTok e do pixel da UTMify (vazio = desligado). */
export const setTrackingPixels = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        password: z.string().min(1).max(200),
        tiktokPixelId: z
          .string()
          .trim()
          .regex(/^[A-Z0-9]{0,40}$/i, "ID do TikTok inválido"),
        utmifyPixelId: z
          .string()
          .trim()
          .regex(/^[\w-]{0,60}$/, "ID da UTMify inválido"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.password !== process.env["ADMIN_PASSWORD"]) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("site_settings").upsert([
      { key: "tiktok_pixel_id", value: data.tiktokPixelId, updated_at: now },
      { key: "utmify_pixel_id", value: data.utmifyPixelId, updated_at: now },
    ]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** IDs públicos dos pixels para o <head> (o token da API do Meta nunca sai do servidor). */
export const getPublicTracking = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [{ getMetaConfig }, settings] = await Promise.all([
      import("./meta.server"),
      readSettings(),
    ]);
    const meta = await getMetaConfig().catch(() => null);
    return {
      metaPixelId: meta?.pixelId ?? null,
      tiktokPixelId: settings.tiktokPixelId,
      utmifyPixelId: settings.utmifyPixelId,
    };
  } catch {
    // Sem banco conectado (ex.: Lovable Cloud ainda não ativado): site funciona sem pixels.
    return { metaPixelId: null, tiktokPixelId: null, utmifyPixelId: null };
  }
});
