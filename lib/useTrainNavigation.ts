"use client";

import { useCallback, useEffect, useState } from "react";

/** Навигация по вагонам: индекс с зажимом в границах. */
export function useTrainNavigation(carCount: number) {
  const count = Math.max(1, carCount); // защита от пустого списка вагонов
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, count - 1)), [count]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const goTo = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(i, count - 1))),
    [count],
  );
  return { index, next, prev, goTo, isFirst: index === 0, isLast: index === count - 1 };
}

/**
 * Компактная раскладка: вертикальный стек вместо горизонтального «поезда».
 * Включается на узких экранах ИЛИ при prefers-reduced-motion (требование спеки).
 * Безопасно в SSR/jsdom (там matchMedia нет — возвращаем false).
 */
export function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const queries = ["(prefers-reduced-motion: reduce)", "(max-width: 767px)"].map((q) =>
      window.matchMedia(q),
    );
    const update = () => setCompact(queries.some((mq) => mq.matches));
    update();
    queries.forEach((mq) => mq.addEventListener("change", update));
    return () => queries.forEach((mq) => mq.removeEventListener("change", update));
  }, []);
  return compact;
}
