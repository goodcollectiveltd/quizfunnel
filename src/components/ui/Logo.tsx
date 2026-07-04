export function Logo({ variant = "orange", className = "" }: { variant?: "orange" | "white"; className?: string }) {
  return (
    <img
      src={`/logos/gfp-logo-${variant}.png`}
      alt="Good for Pets"
      className={`h-9 w-auto ${className}`}
    />
  );
}
