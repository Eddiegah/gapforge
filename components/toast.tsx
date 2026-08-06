"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = {
    success: "border-emerald-500/30 bg-[rgb(var(--card))]",
    error: "border-red-500/30 bg-[rgb(var(--card))]",
    info: "border-violet-500/30 bg-[rgb(var(--card))]",
  };
  const iconColors = { success: "text-emerald-400", error: "text-red-400", info: "text-violet-400" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[300] flex flex-col gap-2 pointer-events-none w-80">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type];
            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                className={cn("pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl shadow-black/20", colors[t.type])}>
                <Icon size={15} className={cn("flex-shrink-0", iconColors[t.type])} />
                <span className="text-sm text-[rgb(var(--fg))] flex-1 font-medium">{t.message}</span>
                <button onClick={() => remove(t.id)} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors flex-shrink-0 p-0.5">
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
