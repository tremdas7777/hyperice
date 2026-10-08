import { createFileRoute } from "@tanstack/react-router";
import { store } from "@/data/store";
import { PolicyPage } from "@/components/store/PageShell";

export const Route = createFileRoute("/politica-reembolso")({
  head: () => ({
    meta: [
      { title: "Trocas e reembolso" },
      { name: "description", content: "Direito de arrependimento, trocas e reembolso." },
      { property: "og:title", content: "Trocas e reembolso" },
      { property: "og:url", content: "/politica-reembolso" },
    ],
    links: [{ rel: "canonical", href: "/politica-reembolso" }],
  }),
  component: () => (
    <PolicyPage
      title="Trocas e reembolso"
      intro="Garantia conforme o Código de Defesa do Consumidor."
    >
      <h2>Direito de arrependimento</h2>
      <p>
        Você tem até 7 dias após o recebimento do produto para desistir da compra e pedir o
        reembolso, conforme o art. 49 do CDC.
      </p>
      <h2>Troca de tamanho</h2>
      <p>
        Recebeu e o tamanho não serviu? Solicite a troca em até 7 dias após o recebimento. O produto
        deve estar sem sinais de uso e com a embalagem original.
      </p>
      <h2>Como solicitar</h2>
      <p>
        Entre em contato {store.email ? `pelo e-mail ${store.email}` : "pela página de contato"} com
        o número do pedido.
      </p>
      <h2>Prazo do reembolso</h2>
      <p>
        O reembolso é processado em até 7 dias úteis após o produto chegar ao nosso centro de
        distribuição, na mesma forma de pagamento usada na compra.
      </p>
    </PolicyPage>
  ),
});
