import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deletePixgateKeyFn, getPixgateStatus, savePixgateKeyFn } from "@/lib/pixgate.functions";

type Status = { key: string | null; source: "admin" | "secret" | null };

/** Pix (PixGate): chave salva no banco; sem ela, vale o secret PIXGATE_API_KEY do Lovable. */
export function PixgateCard({ password }: { password: string }) {
  const statusFn = useServerFn(getPixgateStatus);
  const saveFn = useServerFn(savePixgateKeyFn);
  const deleteFn = useServerFn(deletePixgateKeyFn);

  const [status, setStatus] = useState<Status | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    statusFn({ data: { password } })
      .then(setStatus)
      .catch(() => setStatus({ key: null, source: null }));
  };

  useEffect(() => {
    if (password) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label);
    setMsg(null);
    try {
      setMsg(await fn());
    } catch {
      setMsg("Algo deu errado. Tente de novo.");
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const save = () =>
    run("save", async () => {
      await saveFn({ data: { password, key: key.trim() } });
      setKey("");
      return "Chave salva. Os próximos Pix já usam esta chave.";
    });

  const remove = () =>
    run("delete", async () => {
      await deleteFn({ data: { password } });
      return "Chave apagada do painel.";
    });

  const label =
    status === null
      ? "…"
      : status.source === "admin"
        ? "Chave do painel"
        : status.source === "secret"
          ? "Secret do Lovable"
          : "Sem chave";

  return (
    <Card className="mt-3 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <QrCode className="w-5 h-5 text-muted-foreground" aria-hidden />
          <div>
            <div className="font-medium">Pagamento com Pix (PixGate)</div>
            <div className="text-xs text-muted-foreground">
              A chave salva aqui tem prioridade. Sem ela, o checkout usa o secret PIXGATE_API_KEY do
              Lovable. Sem nenhuma das duas, o Pix não é gerado.
            </div>
          </div>
        </div>
        <span
          className={`text-xs whitespace-nowrap ${status?.source ? "text-emerald-600" : "text-destructive"}`}
        >
          {label}
        </span>
      </div>
      <Input
        type="password"
        autoComplete="off"
        placeholder={status?.key ? `Chave em uso (${status.key})` : "Chave da API PixGate"}
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={key.trim().length < 10 || !!busy} onClick={save}>
          {busy === "save" ? "Salvando…" : "Salvar chave"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={status?.source !== "admin" || !!busy}
          onClick={remove}
        >
          {busy === "delete" ? "Apagando…" : "Apagar chave do painel"}
        </Button>
      </div>
      {msg && <p className="text-xs">{msg}</p>}
    </Card>
  );
}
