import { Mail, MessageCircle } from "lucide-react";
import { store } from "@/data/store";

const payments = ["Pix", "Visa", "Mastercard", "Elo", "Amex", "Boleto"];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink pb-28 pt-16 text-white/70 sm:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          {store.showLogo && (
            <p className="mb-3 font-display text-4xl tracking-wide text-white">
              {store.name}
              <span className="text-heat">.</span>
            </p>
          )}
          <p className="max-w-xs text-sm leading-relaxed">Recuperação para quem não para.</p>
          <div className="mt-5 flex gap-2">
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-heat hover:text-white"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {store.email && (
              <a
                href={`mailto:${store.email}`}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-heat hover:text-white"
                aria-label="E-mail"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            {store.instagram && (
              <a
                href={store.instagram}
                target="_blank"
                rel="noreferrer"
                className="grid h-10 place-items-center rounded-full bg-white/10 px-4 text-xs font-semibold transition hover:bg-heat hover:text-white"
              >
                Instagram
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Loja</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a className="hover:text-white" href="#comprar">
                Comprar
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#tecnologia">
                Tecnologia
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#como-funciona">
                Como funciona
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="#faq">
                Dúvidas frequentes
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Pagamento</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {payments.map((p) => (
              <span
                key={p}
                className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold"
              >
                {p}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs">Ambiente seguro · dados criptografados</p>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-4 pt-6 text-xs leading-relaxed text-white/45 sm:px-6">
        <p>
          © {year}
          {store.showLogo && ` ${store.name}`}
          {store.cnpj && ` · CNPJ ${store.cnpj}`}. Todos os direitos reservados.
        </p>
        <p className="mt-2">
          Loja independente. Nike, Air Zoom e Hyperice são marcas registradas de seus respectivos
          titulares; esta loja não é operada pela Nike nem pela Hyperice.
        </p>
      </div>
    </footer>
  );
}
