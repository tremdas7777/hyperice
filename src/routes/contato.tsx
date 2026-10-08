import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { product, store } from "@/data/store";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { PageHero, PageShell } from "@/components/store/PageShell";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato" },
      { name: "description", content: "Fale com a nossa equipe de atendimento." },
      { property: "og:title", content: "Contato" },
      { property: "og:url", content: "/contato" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: Page,
});

function Page() {
  const { whatsappEnabled } = useStoreSettings();
  const [form, setForm] = useState({ name: "", message: "" });
  const whatsappHref = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(
    `Olá! Quero tirar uma dúvida sobre o ${product.name}.`,
  )}`;

  // A mensagem abre no app de e-mail do cliente, já endereçada à loja.
  const send = (e: FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contato pelo site — ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n${form.name}`);
    window.location.href = `mailto:${store.email}?subject=${subject}&body=${body}`;
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Atendimento"
        title="Estamos aqui para ajudar"
        intro="Respondemos em até 24 horas em dias úteis. Para acompanhar uma entrega, use a página de rastreio."
      />
      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
        <ul className="space-y-4 text-sm">
          {store.email && (
            <li className="flex items-start gap-3 rounded-2xl bg-bone p-5">
              <Mail className="mt-0.5 h-5 w-5 text-heat" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
                  E-mail
                </p>
                <a
                  href={`mailto:${store.email}`}
                  className="mt-1 block font-semibold hover:underline"
                >
                  {store.email}
                </a>
              </div>
            </li>
          )}
          {whatsappEnabled && store.whatsapp && (
            <li className="flex items-start gap-3 rounded-2xl bg-bone p-5">
              <MessageCircle className="mt-0.5 h-5 w-5 text-heat" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
                  WhatsApp
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block font-semibold hover:underline"
                >
                  Chamar no WhatsApp
                </a>
              </div>
            </li>
          )}
          <li className="flex items-start gap-3 rounded-2xl bg-bone p-5">
            <MapPin className="mt-0.5 h-5 w-5 text-heat" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
                Endereço
              </p>
              <p className="mt-1 font-semibold">{store.city}</p>
            </div>
          </li>
        </ul>

        {/* O formulário aparece quando o e-mail de atendimento está configurado (src/data/store.ts). */}
        {store.email ? (
          <form onSubmit={send} className="space-y-5 rounded-3xl border border-stone p-6 sm:p-8">
            <label className="block">
              <span className="text-sm font-semibold">Nome</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 h-12 w-full rounded-xl border border-stone px-4 outline-none focus-visible:border-ink"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Mensagem</span>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2 w-full rounded-xl border border-stone px-4 py-3 outline-none focus-visible:border-ink"
              />
            </label>
            <button className="w-full rounded-full bg-heat py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover">
              Enviar pelo e-mail
            </button>
          </form>
        ) : null}
      </section>
    </PageShell>
  );
}
