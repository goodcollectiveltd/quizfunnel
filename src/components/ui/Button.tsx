import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  size?: "lg" | "md";
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
const sizes = { lg: "px-8 py-4 text-lg", md: "px-6 py-3 text-base" };
const variants = {
  primary: "bg-brand-red text-white shadow-cta hover:brightness-105",
  ghost: "bg-white text-brand-ink ring-1 ring-brand-ink/15 hover:ring-brand-ink/30",
};

export function Button({ children, onClick, href, disabled, variant = "primary", size = "lg", className = "" }: Props) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
