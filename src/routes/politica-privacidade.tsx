import { createFileRoute } from "@tanstack/react-router";
import { store } from "@/data/store";
import { PolicyPage } from "@/components/store/PageShell";

export const Route = createFileRoute("/politica-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade" },
      { name: "description", content: "Como protegemos os seus dados pessoais." },
      { property: "og:title", content: "Política de privacidade" },
      { property: "og:url", content: "/politica-privacidade" },
    ],
    links: [{ rel: "canonical", href: "/politica-privacidade" }],
  }),
  component: () => (
    <PolicyPage
      title="Política de privacidade"
      intro="Tratamos os seus dados de acordo com a Lei Geral de Proteção de Dados (LGPD)."
    >
      <h2>Dados coletados</h2>
      <p>
        Coletamos apenas os dados necessários para processar o pedido, entregar o produto e oferecer
        suporte: nome, e-mail, telefone, CPF e endereço de entrega.
      </p>
      <h2>Uso dos dados</h2>
      <ul>
        <li>Processamento de pedidos e pagamentos</li>
        <li>Envio dos produtos e comunicação sobre o pedido</li>
        <li>Suporte ao cliente</li>
        <li>Medição de campanhas de anúncios (cookies e pixels de navegação)</li>
      </ul>
      <h2>Pagamentos</h2>
      <p>
        Os dados do cartão são enviados diretamente ao processador de pagamentos e não ficam salvos
        na loja.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados{" "}
        {store.email ? `pelo e-mail ${store.email}` : "pela página de contato"}.
      </p>
    </PolicyPage>
  ),
});
