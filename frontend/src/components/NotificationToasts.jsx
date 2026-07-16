import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationToasts() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="flex w-80 items-start gap-3 rounded-xl border border-line bg-panel/95 p-4 shadow-glowRed backdrop-blur-md"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blood/20 text-blood">
              <Bell className="h-4 w-4" />
            </div>
            <p className="flex-1 text-sm text-bone">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-steel hover:text-ember">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
