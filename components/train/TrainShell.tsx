"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import type { SiteMode } from "@/lib/siteMode";
import { siteContent } from "@/content/site";
import { useTrainNavigation, useCompactLayout } from "@/lib/useTrainNavigation";
import { Car } from "./Car";
import { Door } from "./Door";
import { TrainProgress } from "./TrainProgress";

export type CarDef = { id: string; label: string; content: ReactNode };

export function TrainShell({ mode, cars }: { mode: SiteMode; cars: CarDef[] }) {
  const compact = useCompactLayout();
  const { index, next, prev, goTo, isFirst, isLast } = useTrainNavigation(cars.length);

  // Навигация стрелками ← / → между вагонами. Слушаем на окне, но пропускаем
  // ввод в полях формы (иначе стрелки в поле «контакт» дёргали бы поезд и
  // блокировали курсор). В компактном режиме стрелки не трогаем — там скролл.
  useEffect(() => {
    if (compact) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (t instanceof Element && (t.closest("input, textarea, select") || (t as HTMLElement).isContentEditable)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact, next, prev]);

  // Перевод фокуса в активный вагон при навигации: клавиатурная/кнопочная
  // смена вагона не должна оставлять фокус «в никуда». На первом рендере не
  // трогаем (иначе фокус уводит со страницы сразу при загрузке); в компактном
  // режиме (вертикальный стек) — тоже, там уместнее обычный скролл-фокус.
  const firstRender = useRef(true);
  useEffect(() => {
    if (compact) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document
      .querySelector<HTMLElement>(`[data-car-index="${index}"]`)
      ?.focus({ preventScroll: true });
  }, [index, compact]);

  const cta =
    mode === "teaser"
      ? { label: "Предварительная регистрация", href: "#pre-register" }
      : { label: "Забронировать", href: siteContent.contacts.telegram };

  // В режиме поезда вагон контактов off-screen — переходим к нему навигацией,
  // а не якорем. В компактном режиме (вертикаль) работает обычный якорь.
  function onTeaserCtaClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!compact) {
      e.preventDefault();
      goTo(cars.length - 1);
    }
  }

  const carEls = cars.map((c, i) => (
    <Car key={c.id} id={c.id} label={c.label} index={i}>
      {c.content}
    </Car>
  ));

  return (
    <div className={compact ? "train train-stacked" : "train"}>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-line bg-ink/90 px-6 py-4 backdrop-blur">
        <span className="font-display text-2xl text-acid">{siteContent.clubName}</span>
        {!compact && (
          <TrainProgress labels={cars.map((c) => c.label)} current={index} onSelect={goTo} />
        )}
        <a
          href={cta.href}
          onClick={mode === "teaser" ? onTeaserCtaClick : undefined}
          {...(mode === "live" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="bg-acid px-4 py-2 font-display text-sm uppercase text-ink"
        >
          {cta.label}
        </a>
      </header>

      {compact ? (
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
