"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-400/30 text-emerald-100",
  error: "border-rose-400/30 text-rose-100",
  info: "border-violet-400/30 text-violet-100",
  warning: "border-amber-400/30 text-amber-100",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const item: ToastItem = { ...options, id, tone: options.tone ?? "info" };
      setItems((prev) => [...prev.slice(-4), item]);
      const duration = options.durationMs ?? 4000;
      if (duration > 0) {
        timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-slate-900/95 p-4 shadow-xl backdrop-blur ${toneClasses[item.tone]}`}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-slate-300">
                  {item.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="rounded-lg px-1 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
