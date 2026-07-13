"use client";

import { useCallback, useEffect, useState } from "react";

/** Навигация по вагонам: индекс с зажимом в границах. */
export function useTrainNavigation(carCount: number) {
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, carCount - 1)), [carCount]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const goTo = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(i, carCount - 1))),
    [carCount],
  );
  return { index, next, prev, goTo, isFirst: index === 0, isLast: index === carCount - 1 };
}

/** true, если пользователь просит уменьшить движение. Безопасно в SSR/jsdom. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
