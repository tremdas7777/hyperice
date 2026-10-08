import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { trackByCpf, type RastreioStatus } from "@/lib/rastreio.functions";
import { PageHero, PageShell } from "@/components/store/PageShell";

export const Route = createFileRoute("/rastreio")({
  head: () => ({
    meta: [
      { title: "Rastrear pedido" },
      { name: "description", content: "Acompanhe a entrega do seu pedido pelo CPF do titular." },
      { property: "og:title", content: "Rastrear pedido" },
      { property: "og:url", content: "/rastreio" },
    ],
    links: [{ rel: "canonical", href: "/rastreio" }],
  }),
  component: Page,
});

function formatCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

const STEPS: { key: RastreioStatus; title: string; sub: string }[] = [
  { key: "pedido_recebido", title: "Pedido recebido", sub: "Processando no centro" },
  { key: "postado", title: "Postado", sub: "Despachado pela transportadora" },
  { key: "em_transito", title: "Em trânsito", sub: "A caminho da sua cidade" },
  { key: "saiu_entrega", title: "Saiu para entrega", sub: "Com o entregador" },
  { key: "entregue", title: "Entregue", sub: "Pedido finalizado" },
];

function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} dias`;
}

function Page() {
  const [cpf, setCpf] = useState("");
  const trackFn = useServerFn(trackByCpf);
  const mutation = useMutation({
    mutationFn: (cpfValue: string) => trackFn({ data: { cpf: cpfValue } }),
  });

  const result = mutation.data;
  const currentIdx = result ? STEPS.findIndex((s) => s.key === result.status) : -1;

  return (
    <PageShell>
      <PageHero
        eyebrow="Rastreio"
        title="Acompanhe o seu pedido"
        intro="Informe o CPF do titular do pedido para consultar o status da entrega."
      />
      <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <form
          className="flex flex-col gap-3 rounded-3xl bg-bone p-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(cpf);
          }}
        >
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            aria-label="CPF do titular"
            className="h-14 flex-1 rounded-2xl bg-white px-5 text-lg outline-none placeholder:text-ink/30 focus-visible:ring-2 focus-visible:ring-ink/10"
          />
          <button
            disabled={mutation.isPending}
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-heat px-8 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Buscando..." : "Rastrear"}
          </button>
        </form>

        {mutation.isError && (
          <p className="mt-6 text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        {result && (
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">
              Pedido {result.pedido}
            </p>
            <p className="mt-2 font-display text-4xl uppercase">
              {STEPS[currentIdx]?.title ?? "Pedido recebido"}
            </p>
            <p className="mt-1 text-sm text-mute">
              Atualizado {formatRelative(result.data_atualizacao)}
            </p>
            {result.tracking_code && (
              <div className="mt-8 rounded-2xl bg-bone p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
                  Código de rastreio
                </p>
                <p className="mt-2 font-display text-3xl">{result.tracking_code}</p>
                {result.tracking_url && (
                  <a
                    href={result.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-heat hover:opacity-80"
                  >
                    Acompanhar na transportadora →
                  </a>
                )}
              </div>
            )}
            <ol className="mt-8 space-y-3">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx;
                return (
                  <li
                    key={step.key}
                    className={`flex items-center gap-4 rounded-2xl border p-5 ${
                      done ? "border-ink/10 bg-white" : "border-stone bg-bone/50"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        done ? "bg-ink text-white" : "bg-stone text-mute"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${done ? "" : "text-mute"}`}>
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-[0.15em] text-mute">
                        {done ? step.sub : "Aguardando"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </PageShell>
  );
}
