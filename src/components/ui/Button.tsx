import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * Standar ukuran mengikuti aturan target sentuh minimum 44x44 px:
 * sm = 36px (khusus aksi sekunder non-kritis), md/lg/xl >= 44px.
 */
const VARIANTS: Record<Variant, string> = {
  // Aksen tunggal espresso untuk CTA penting
  primary:
    "bg-espresso-800 text-white hover:bg-espresso-900 active:bg-espresso-950 disabled:bg-zinc-300 disabled:text-zinc-500",
  secondary:
    "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 disabled:text-zinc-400",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-200 active:bg-zinc-300 disabled:text-zinc-400",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-zinc-300",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-touch px-4 text-sm",
  lg: "h-12 px-5 text-base",
  xl: "h-14 px-6 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", fullWidth, loading, className, children, disabled, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold",
          "transition-colors duration-100 select-none",
          "disabled:cursor-not-allowed disabled:opacity-70",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  }
);