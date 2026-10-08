import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { sizes } from "@/data/store";

export function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Guia de tamanhos"
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone px-6 py-4">
              <h3 className="font-display text-2xl uppercase">Guia de tamanhos</h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-bone"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-mute">
                    <th className="py-2">BR</th>
                    <th className="py-2">US Masc.</th>
                    <th className="py-2">US Fem.</th>
                    <th className="py-2">Pé (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((s) => (
                    <tr key={s.br} className="border-t border-stone">
                      <td className="py-2.5 font-bold">{s.br}</td>
                      <td className="py-2.5">{s.usM}</td>
                      <td className="py-2.5">{s.usW}</td>
                      <td className="py-2.5">{s.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-stone bg-bone px-6 py-4 text-xs leading-relaxed text-mute">
              Meça o pé do calcanhar até a ponta do dedo maior. Ficou entre dois números? Escolha o
              maior — a tira é ajustável.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
