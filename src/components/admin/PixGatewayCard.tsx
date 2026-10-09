import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteUmbrellaKeyFn,
  getPixGatewayStatus,
  saveUmbrellaKeyFn,
  setPixGatewayFn,
  testUmbrellaFn,
} from "@/lib/pix-gateway.functions";

type Gateway = "umbrella" | "pixgate";
type Status = {
  selected: Gateway;
  active: Gateway;
  configured: Record<Gateway, boolean>;
  umbrellaKey: string | null;
  umbrellaSource: "admin" | "secret" | null;
};

const LABEL: Record<Gateway, string> = { umbrella: "Umbrella", pixgate: "PixGate" };

/** Escolha do gateway do Pix (Umbrella ou PixGate) + chave da Umbrella. */
export function PixGatewayCard({ password }: { password: string }) {
  const statusFn = useServerFn(getPixGatewayStatus);
  const setFn = useServerFn(setPixGatewayFn);
  const saveFn = useServerFn(saveUmbrellaKeyFn);
  const deleteFn = useServerFn(deleteUmbrellaKeyFn);
  const testFn = useServerFn(testUmbrellaFn);

  const [status, setStatus] = useState<Status | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    statusFn({ data: { password } })
      .then(setStatus)
      .catch(() => setStatus(null));
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
    } catch (e) {
      setMsg(e instanceof Error && e.message ? e.message : "Algo deu errado. Tente de novo.");
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const choose = (gateway: Gateway) =>
    run(`set-${gateway}`, async () => {
      await setFn({ data: { password, gateway } });
      return `Pronto: os próximos Pix saem pela ${LABEL[gateway]}. Pedidos já gerados continuam no gateway de origem.`;
    });

  const save = () =>
    run("save", async () => {
      await saveFn({ data: { password, key: key.trim() } });
      setKey("");
      return "Chave da Umbrella salva.";
    });

  const remove = () =>
    run("delete", async () => {
      await deleteFn({ data: { password } });
      return "Chave da Umbrella apagada do painel.";
    });

  const test = () =>
    run("test", async () => {
      const r = await testFn({ data: { password } });
      return r.ok
        ? "Chave da Umbrella aceita."
        : `Chave da Umbrella com problema: ${r.error ?? `erro ${r.status ?? ""}`}`;
    });

  const keyLabel =
    status === null
      ? "…"
      : status.umbrellaSource === "admin"
        ? "Chave do painel"
        : status.umbrellaSource === "secret"
          ? "Secret do Lovable"
          : "Sem chave";

  return (
    <Card className="mt-3 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-muted-foreground" aria-hidden />
          <div>
            <div className="font-medium">Gateway do Pix</div>
            <div className="text-xs text-muted-foreground">
              Escolha quem gera os próximos Pix. A troca vale na hora; pedidos já gerados continuam
              sendo confirmados pelo gateway em que foram criados.
            </div>
          </div>
        </div>
        <span className="text-xs whitespace-nowrap text-emerald-600">
          {status ? `Em uso: ${LABEL[status.active]}` : "…"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["umbrella", "pixgate"] as const).map((g) => (
          <Button
            key={g}
            size="sm"
            variant={status?.selected === g ? "default" : "outline"}
            disabled={!status || !!busy || status.selected === g}
            onClick={() => choose(g)}
          >
            {busy === `set-${g}` ? "Salvando…" : LABEL[g]}
            {status && !status.configured[g] ? " (sem chave)" : ""}
          </Button>
        ))}
      </div>

      {status && status.active !== status.selected && (
        <p className="text-xs text-destructive">
          A {LABEL[status.selected]} está escolhida mas sem chave, então o checkout está usando a{" "}
          {LABEL[status.active]}. Cadastre a chave para ela entrar em uso.
        </p>
      )}

      <div className="flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium">Chave da API Umbrella</div>
          <span
            className={`text-xs whitespace-nowrap ${status?.umbrellaSource ? "text-emerald-600" : "text-destructive"}`}
          >
            {keyLabel}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          A chave salva aqui tem prioridade. Sem ela, vale o secret UMBRELLA_API_KEY do Lovable.
        </div>
        <Input
          type="password"
          autoComplete="off"
          placeholder={
            status?.umbrellaKey ? `Chave em uso (${status.umbrellaKey})` : "Chave da API Umbrella"
          }
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={key.trim().length < 10 || !!busy} onClick={save}>
            {busy === "save" ? "Salvando…" : "Salvar chave"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!status?.umbrellaSource || !!busy}
            onClick={test}
          >
            {busy === "test" ? "Testando…" : "Testar chave"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={status?.umbrellaSource !== "admin" || !!busy}
            onClick={remove}
          >
            {busy === "delete" ? "Apagando…" : "Apagar chave do painel"}
          </Button>
        </div>
      </div>
      {msg && <p className="text-xs">{msg}</p>}
    </Card>
  );
}
