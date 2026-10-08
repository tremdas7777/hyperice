import { AnimatePresence, motion } from "motion/react";
import { useShop } from "@/state/shop";

export function Toast() {
  const { toast } = useShop();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4"
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="max-w-md rounded-2xl bg-ink px-5 py-3.5 text-sm font-medium text-white shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
