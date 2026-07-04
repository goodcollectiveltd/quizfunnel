import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

const LINES = [
  "Matching the symptoms…",
  "Reading 300+ real reviews…",
  "Checking the cold-press mechanism…",
  "Building the plan…",
];

export function Analysing({ dog, onDone }: { dog: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const step = setInterval(() => setI((v) => Math.min(v + 1, LINES.length - 1)), 650);
    const done = setTimeout(onDone, 2600);
    return () => {
      clearInterval(step);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="container-page flex flex-col items-center text-center">
        <Logo />
        <div className="relative mt-10 grid h-20 w-20 place-items-center">
          <span className="absolute inset-0 rounded-full bg-brand-red/30 animate-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-brand-red/20 animate-pulse-ring [animation-delay:0.5s]" />
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-red text-3xl">🐾</span>
        </div>
        <h1 className="mt-8 text-xl font-extrabold text-brand-ink">
          Building {dog}'s relief plan
        </h1>
        <p className="mt-2 h-6 text-brand-ink/60 transition-all">{LINES[i]}</p>
      </div>
    </div>
  );
}
