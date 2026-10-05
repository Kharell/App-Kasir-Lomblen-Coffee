import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
}

/** Input dengan label, pesan error, dan tinggi minimal 44px. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, className, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "h-touch w-full rounded-lg border bg-white px-3 text-base text-zinc-900",
            "placeholder:text-zinc-400",
            "focus:border-espresso-600 focus:outline-none focus:ring-1 focus:ring-espresso-600",
            "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
            error ? "border-red-500" : "border-zinc-300",
            prefix ? "pl-10" : "",
            className
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});