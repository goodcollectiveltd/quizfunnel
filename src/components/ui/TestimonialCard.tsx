import type { Testimonial } from "@/data/testimonials";
import { StarRating } from "./StarRating";

export function TestimonialCard({ t }: { t: Testimonial }) {
  const initials = t.author
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <figure className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <StarRating className="mb-3" />
      <blockquote className="flex-1 text-[15px] leading-relaxed text-brand-ink/90">
        "{t.quote}"
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-xs font-bold text-brand-red">
          {initials}
        </span>
        <span className="text-sm">
          <span className="block font-semibold text-brand-ink">{t.author}</span>
          <span className="block text-xs text-brand-ink/50">Verified review · {t.source}</span>
        </span>
      </figcaption>
    </figure>
  );
}
