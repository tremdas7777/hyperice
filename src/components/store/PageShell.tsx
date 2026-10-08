import type { ReactNode } from "react";
import { AnnouncementBar } from "./AnnouncementBar";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Toast } from "./Toast";

/** Layout das páginas internas da loja (rastreio, contato, políticas…). */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-paper font-sans text-ink antialiased">
      <AnnouncementBar />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
      <Toast />
    </div>
  );
}

/** Cabeçalho escuro das páginas internas. */
export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="bg-ink pb-14 pt-16 text-white sm:pb-20 sm:pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-heat" />
          {eyebrow}
        </span>
        <h1 className="mt-4 font-display text-[clamp(2.8rem,8vw,5rem)] uppercase leading-[0.92]">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">{intro}</p>}
      </div>
    </section>
  );
}

/** Página de política: título + texto com h2/p/ul estilizados. */
export function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <PageHero eyebrow="Políticas" title={title} intro={intro} />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="space-y-5 text-[15px] leading-relaxed text-ink/75 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:uppercase [&_h2]:text-ink [&_li]:border-b [&_li]:border-stone [&_li]:pb-3 [&_ul]:space-y-3">
          {children}
        </div>
      </section>
    </PageShell>
  );
}
