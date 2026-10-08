import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { product, store } from "@/data/store";
import { FREE_SHIPPING_TEXT } from "@/lib/shipping";
import { PageHero, PageShell } from "@/components/store/PageShell";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a loja" },
      { name: "description", content: "Conheça a loja e como cuidamos do seu pedido." },
      { property: "og:title", content: "Sobre a loja" },
      { property: "og:url", content: "/sobre" },
    ],
    links: [{ rel: "canonical", href: "/sobre" }],
  }),
  component: Page,
});

const pillars = [
  {
    icon: Truck,
    title: "Envio para todo o Brasil",
    text: `${FREE_SHIPPING_TEXT} em produtos, com código de rastreio assim que o pedido é despachado.`,
  },
  {
    icon: ShieldCheck,
    title: "Compra segura",
    text: "Pagamento por Pix ou cartão em ambiente criptografado. Os dados do cartão não ficam salvos na loja.",
  },
  {
    icon: PackageCheck,
    title: "Troca fácil",
    text: "Você tem até 7 dias após o recebimento para trocar ou devolver, conforme o Código de Defesa do Consumidor.",
  },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Sobre"
        title="Recuperação para quem não para"
        intro={`Somos uma loja independente focada em recovery wear. Aqui você encontra o ${product.name} com atendimento em português, envio nacional e troca garantida.`}
      />
      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {pillars.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl bg-bone p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-display text-2xl uppercase">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-16 text-sm leading-relaxed text-mute sm:px-6">
        <p>
          {store.cnpj ? `CNPJ ${store.cnpj}. ` : ""}
          {store.city}. Nike, Air Zoom e Hyperice são marcas registradas de seus respectivos
          titulares; esta loja não é operada pela Nike nem pela Hyperice.
        </p>
      </section>
    </PageShell>
  );
}
