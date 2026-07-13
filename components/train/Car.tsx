import type { ReactNode } from "react";

/** Семантическая обёртка вагона. */
export function Car({
  id,
  label,
  index,
  children,
}: {
  id: string;
  label: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-label={label} data-car-index={index} className="train-car">
      {children}
    </section>
  );
}
