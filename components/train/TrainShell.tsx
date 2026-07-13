"use client";

import type { ReactNode } from "react";
import type { SiteMode } from "@/lib/siteMode";
import { siteContent } from "@/content/site";
import { useTrainNavigation, usePrefersReducedMotion } from "@/lib/useTrainNavigation";
import { Car } from "./Car";
import { Door } from "./Door";
import { TrainProgress } from "./TrainProgress";

export type CarDef = { id: string; label: string; content: ReactNode };

export function TrainShell({ mode, cars }: { mode: SiteMode; cars: CarDef[] }) {
  const reduced = usePrefersReducedMotion();
  const { index, next, prev, goTo, isFirst, isLast } = useTrainNavigation(cars.length);

  const cta =
    mode === "teaser"
      ? { label: "Предварительная регистрация", href: "#pre-register" }
      : { label: "Забронировать", href: siteContent.contacts.telegram };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      prev();
    }
  }

  const carEls = cars.map((c, i) => (
    <Car key={c.id} id={c.id} label={c.label} index={i}>
      {c.content}
    </Car>
  ));

  return (
    <div className={reduced ? "train train-stacked" : "train"} onKeyDown={onKeyDown} tabIndex={0}>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-line bg-ink/90 px-6 py-4 backdrop-blur">
        <span className="font-display text-2xl text-acid">{siteContent.clubName}</span>
        {!reduced && <TrainProgress count={cars.length} current={index} onSelect={goTo} />}
        <a href={cta.href} className="bg-acid px-4 py-2 font-display text-sm uppercase text-ink">
          {cta.label}
        </a>
      </header>

      {reduced ? (
        <main>{carEls}</main>
      ) : (
        <main className="train-viewport relative">
          <div className="train-track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {carEls}
          </div>
          <Door open={false} />
          <div className="train-controls fixed bottom-6 right-6 z-50 flex gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={isFirst}
              aria-label="Предыдущий вагон"
              className="bg-ink-soft px-4 py-2 text-fog disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              disabled={isLast}
              aria-label="Следующий вагон"
              className="bg-acid px-4 py-2 text-ink disabled:opacity-40"
            >
              →
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
