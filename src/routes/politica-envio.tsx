import { createFileRoute } from "@tanstack/react-router";
import { FRETES } from "@/lib/shipping";
import { brl } from "@/components/checkout/parts";
import { PolicyPage } from "@/components/store/PageShell";

export const Route = createFileRoute("/politica-envio")({
  head: () => ({
    meta: [
      { title: "Política de envio" },
      { name: "description", content: "Prazos, opções de frete e rastreamento dos pedidos." },
      { property: "og:title", content: "Política de envio" },
      { property: "og:url", content: "/politica-envio" },
    ],
    links: [{ rel: "canonical", href: "/politica-envio" }],
  }),
  component: () => (
    <PolicyPage title="Política de envio" intro="Enviamos para todo o Brasil, com rastreamento.">
      <h2>Prazo de postagem</h2>
      <p>Os pedidos são despachados em até 2 dias úteis após a confirmação do pagamento.</p>
      <h2>Opções de frete</h2>
      <ul>
        {FRETES.map((f) => (
          <li key={f.id}>
            <b>{f.name}</b> — {f.eta} — {f.price ? brl(f.price) : "grátis"}
          </li>
        ))}
      </ul>
      <p>O frete grátis vale para todo o Brasil, em qualquer pedido.</p>
      <h2>Rastreamento</h2>
      <p>
        Assim que o pedido é despachado, você recebe o código de rastreio e pode acompanhar a
        entrega na página Rastrear pedido, informando o CPF do titular.
      </p>
      <h2>Envio expresso</h2>
      <p>
        Depois da compra, você pode contratar o envio expresso para que o pedido seja despachado com
        prioridade.
      </p>
    </PolicyPage>
  ),
});
