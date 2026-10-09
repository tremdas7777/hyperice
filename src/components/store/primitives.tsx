import { motion, type HTMLMotionProps } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Título com revelação palavra a palavra. Use "\n" para quebrar linha. */
export function SplitTitle({
  text,
  className,
  as = "h2",
  delay = 0,
  immediate = false,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
  immediate?: boolean;
}) {
  const lines = text.split("\n");
  let index = 0;

  // No topo da página a animação é em CSS (classe enter-word): roda antes do JavaScript carregar.
  if (immediate) {
    const Plain = as;
    return (
      <Plain className={className} aria-label={text.replace(/\n/g, " ")}>
        {lines.map((line, li) => (
          <span key={li} className="block" aria-hidden>
            {line.split(" ").map((word, wi) => {
              const i = index++;
              return (
                <span
                  key={wi}
                  className="-mt-[0.2em] inline-block overflow-hidden pb-[0.08em] pt-[0.2em] align-bottom"
                >
                  <span
                    className="enter-word inline-block"
                    style={
                      { "--enter-delay": `${(delay + i * 0.07).toFixed(2)}s` } as CSSProperties
                    }
                  >
                    {word}
                    {wi < line.split(" ").length - 1 ? " " : ""}
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </Plain>
    );
  }

  const Tag = motion[as];
  const animateProps = {
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, margin: "-60px" },
  };
  return (
    <Tag className={className} {...animateProps} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.split(" ").map((word, wi) => {
            const i = index++;
            return (
              <span
                key={wi}
                className="-mt-[0.2em] inline-block overflow-hidden pb-[0.08em] pt-[0.2em] align-bottom"
              >
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: { y: "110%", rotate: 4 },
                    show: {
                      y: "0%",
                      rotate: 0,
                      transition: { duration: 0.9, delay: delay + i * 0.07, ease },
                    },
                  }}
                >
                  {word}
                  {wi < line.split(" ").length - 1 ? " " : ""}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-heat" />
      {children}
    </span>
  );
}

export function ShineButton({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-heat px-7 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-heat-hover active:scale-[0.98] disabled:opacity-60 ${className}`}
      {...rest}
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
