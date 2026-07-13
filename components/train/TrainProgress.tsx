/** Индикатор-схема поезда: по метке на каждый вагон, текущий подсвечен. */
export function TrainProgress({
  count,
  current,
  onSelect,
}: {
  count: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="hidden md:flex items-center gap-2" aria-label="Схема поезда">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <button
            type="button"
            aria-label={`Вагон ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
            onClick={() => onSelect(i)}
            className={`block h-1 w-6 ${i === current ? "bg-acid" : "bg-line"}`}
          />
        </li>
      ))}
    </ol>
  );
}
