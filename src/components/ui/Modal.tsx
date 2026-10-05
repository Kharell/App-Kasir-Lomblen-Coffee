"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** true untuk bottom sheet di layar kecil */
  sheetOnMobile?: boolean;
}

/**
 * Modal yangaccessible:
 * - portal ke body (menghindari masalah z-index di container transform)
 * - tutup dengan Escape
 * - kunci scroll body saat terbuka
 * - fokus otomatis ke panel
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  sheetOnMobile = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 animate-fade-in bg-zinc-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-raised outline-none",
          sheetOnMobile
            ? "animate-slide-up rounded-t-2xl sm:max-w-lg sm:animate-fade-in sm:rounded-2xl"
            : "animate-fade-in rounded-2xl sm:max-w-lg"
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-zinc-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1 flex h-touch w-touch shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 active:bg-zinc-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}