import { AnimatePresence, motion } from "framer-motion";

import { useToastStore } from "@/store/toastStore";

const VARIANT_STYLES: Record<string, string> = {
  success: "border-state-established/30 bg-state-established/10 text-state-established",
  error: "border-state-closing/30 bg-state-closing/10 text-state-closing",
  info: "border-accent/30 bg-accent/10 text-accent",
};

export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto max-w-xs cursor-pointer rounded-md border px-3 py-2 text-xs font-medium shadow-panel ${VARIANT_STYLES[t.variant]}`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
