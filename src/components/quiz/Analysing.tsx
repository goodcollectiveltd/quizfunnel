import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

const stepsFor = (dog: string) => [
  `Analysing ${dog}'s symptoms`,
  `Reading ${dog}'s gut signals`,
  `Scoring ${dog}'s gut balance`,
  `Matching ${dog} to 10,000+ similar dogs`,
  `Building ${dog}'s personalised plan`,
];

export function Analysing({ dog, onDone }: { dog: string; onDone: () => void }) {
  const STEPS = stepsFor(dog);
  const [done, setDone] = useState(0);
  useEffect(() => {
    // Paced to feel like a genuine, custom calculation (~5s) rather than an instant jump.
    const t = setInterval(() => setDone((d) => Math.min(d + 1, STEPS.length)), 900);
    const finish = setTimeout(onDone, 5000);
    return () => {
      clearInterval(t);
      clearTimeout(finish);
    };
  }, [onDone]);

  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="container-page w-full">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-8 text-2xl font-extrabold text-brand-ink">Building {dog}'s gut &amp; skin plan…</h1>
          <p className="mt-2 text-brand-ink/60">Mapping the answers against the Good for Pets method.</p>
        </div>
        <ul className="mx-auto mt-8 max-w-sm space-y-3">
          {STEPS.map((label, i) => {
            const state = i < done ? "done" : i === done ? "active" : "todo";
            return (
              <li key={label}
                className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-4 transition-all ${state === "active" ? "border-brand-red shadow-card" : "border-transparent"} ${state === "todo" ? "opacity-40" : ""}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm ${state === "done" ? "bg-brand-red text-white" : "bg-brand-ink/10 text-brand-ink/50"}`}>
                  {state === "done" ? "✓" : state === "active" ? "•" : ""}
                </span>
                <span className={`font-semibold ${state === "done" ? "text-brand-ink" : "text-brand-ink/70"}`}>{label}</span>
                {state === "active" && <span className="ml-auto text-xs font-semibold text-brand-red">…</span>}
              </li>
            );
          })}
        </ul>
        <div className="mx-auto mt-8 flex max-w-sm items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
          <img src="/images/people/kishan.jpg" alt="Dr Kishan Vara, veterinary surgeon" className="h-12 w-12 shrink-0 rounded-full object-cover" />
          <p className="text-left text-sm text-brand-ink/70">
            Checked against the method guided by our vet, <strong className="text-brand-ink">Dr Kishan Vara</strong>: veterinary surgeon, Royal Veterinary College.
          </p>
        </div>
      </div>
    </div>
  );
}
