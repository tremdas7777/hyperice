import { createFileRoute } from "@tanstack/react-router";
import { product } from "@/data/store";
import { FAQ } from "@/components/store/FAQ";
import { FinalCTA } from "@/components/store/FinalCTA";
import { PageShell } from "@/components/store/PageShell";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: `Perguntas frequentes | ${product.name}` },
      {
        name: "description",
        content: `Tire dúvidas sobre o ${product.name}: pod de calor e massagem, tamanhos, kit de 2 pares, envio e trocas.`,
      },
      { property: "og:title", content: "Perguntas frequentes" },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
  }),
  component: () => (
    <PageShell>
      <FAQ />
      <FinalCTA />
    </PageShell>
  ),
});
