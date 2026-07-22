"use client";

import dynamic from "next/dynamic";

// WebGL-сцена работает только в браузере — грузим без SSR.
const TrainScene = dynamic(() => import("@/components/train3d/TrainScene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-ink text-muted">
      Загрузка сцены…
    </div>
  ),
});

export default function Train3DPage() {
  return (
    <div className="fixed inset-0 bg-ink">
      <TrainScene />
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex items-center justify-center gap-3 text-center">
        <span className="font-display text-xs uppercase tracking-widest text-acid">
          Колесо · стрелки · свайп — вглубь поезда
        </span>
      </div>
    </div>
  );
}
