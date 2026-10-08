import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSiteSettings, setTrackingPixels } from "@/lib/site-settings.functions";

/** Pixels do TikTok e da UTMify: IDs públicos, carregados no <head> de todas as páginas. */
export function TrackingPixelsCard({ password }: { password: string }) {
  const loadFn = useServerFn(getSiteSettings);
  const saveFn = useServerFn(setTrackingPixels);
  const [tiktok, setTiktok] = useState("");
  const [utmify, setUtmify] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!password) return;
    loadFn()
      .then((s) => {
        setTiktok(s.tiktokPixelId ?? "");
        setUtmify(s.utmifyPixelId ?? "");
      })
      .catch(() => setMsg("Não foi possível carregar."));
  }, [password, loadFn]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await saveFn({ data: { password, tiktokPixelId: tiktok, utmifyPixelId: utmify } });
      setMsg("Salvo. Vale a partir do próximo carregamento das páginas.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-3 p-5">
      <div className="mb-4 flex items-center gap-3">
        <Radar className="h-5 w-5 text-muted-foreground" aria-hidden />
        <div>
          <div className="font-medium">Pixels do TikTok e da UTMify</div>
          <div className="text-xs text-muted-foreground">
            Cole só o ID de cada pixel. Deixe vazio para desligar. A venda continua sendo enviada à
            UTMify pela integração de token (acima), independentemente do pixel.
          </div>
        </div>
      </div>
      <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>ID do pixel do TikTok</span>
          <Input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value.trim())}
            placeholder="Ex.: C1234ABCD5678EFGH"
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>ID do pixel da UTMify</span>
          <Input
            value={utmify}
            onChange={(e) => setUtmify(e.target.value.trim())}
            placeholder="Ex.: 66f1a2b3c4d5e6f7a8b9c0d1"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Salvando…" : "Salvar"}
          </Button>
          {msg && <span className="text-xs text-foreground">{msg}</span>}
        </div>
      </form>
    </Card>
  );
}
