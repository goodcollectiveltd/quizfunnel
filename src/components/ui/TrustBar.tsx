const ITEMS = [
  "★★★★★ Real reviews",
  "UK-made to GMP",
  "5 billion live bacteria",
  "51% of profits to charity",
];

export function TrustBar({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-brand-ink/70 ${className}`}>
      {ITEMS.map((t) => (
        <li key={t} className="whitespace-nowrap">
          {t}
        </li>
      ))}
    </ul>
  );
}
