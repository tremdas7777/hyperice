import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { faq } from "@/data/store";
import { Eyebrow, Reveal, SplitTitle } from "./primitives";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-16 bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <Eyebrow className="text-mute">Dúvidas</Eyebrow>
          <SplitTitle
            text={"Perguntas\nfrequentes."}
            className="mt-4 font-display text-[clamp(2.6rem,5.5vw,4.5rem)] uppercase leading-[0.92]"
          />
        </div>
        <div className="border-t border-stone">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.04} y={14} className="border-b border-stone">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold"
                  aria-expanded={isOpen}
                >
                  {item.q}
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                      isOpen ? "rotate-45 border-heat bg-heat text-white" : "border-stone"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 leading-relaxed text-mute">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
