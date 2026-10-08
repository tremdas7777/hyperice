import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { store } from "@/data/store";

const links = [
  { href: "/#comprar", label: "Comprar" },
  { href: "/#tecnologia", label: "Tecnologia" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#faq", label: "Dúvidas" },
  { href: "/rastreio", label: "Rastrear pedido" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-ink/85 backdrop-blur-xl" : "bg-ink"
      } text-white`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {store.showLogo ? (
          <a
            href="/"
            className="font-display text-2xl tracking-wide"
            aria-label={`${store.name} — início`}
          >
            {store.name}
            <span className="text-heat">.</span>
          </a>
        ) : (
          <span className="w-10 md:w-24" />
        )}

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-white/80 transition hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-heat after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href="/#comprar"
            className="rounded-full bg-heat px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover"
          >
            Comprar
          </a>
          <button
            className="rounded-full p-2.5 transition hover:bg-white/10 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 md:hidden"
          >
            <div className="flex flex-col px-4 py-3">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="py-3 font-display text-2xl uppercase tracking-wide"
                >
                  {l.label}
                </motion.a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
