"use client";

import { useEffect, useState } from "react";

function diff(target: number, now: number) {
  // Защита от некорректной даты: при NaN показываем нули, а не "NaN".
  const ms = Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const sec = Math.floor(ms / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

export function Countdown({ targetDate }: { targetDate: string }) {
  const target = new Date(targetDate).getTime();
  // На сервере и при первом рендере клиента показываем детерминированные нули,
  // реальное значение считаем уже после монтирования — иначе SSR и клиент
  // разойдутся (гидрационная ошибка на «секундах»).
  const [left, setLeft] = useState(() => diff(target, target));

  useEffect(() => {
    setLeft(diff(target, Date.now()));
    const id = setInterval(() => setLeft(diff(target, Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cell = (value: number, label: string, testId: string) => (
    <div className="flex flex-col items-center">
      <span data-testid={testId} className="font-display text-5xl text-acid">
        {value}
      </span>
      <span className="text-xs uppercase text-muted">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-6" role="group" aria-label="Обратный отсчёт до открытия">
      {cell(left.days, "дней", "countdown-days")}
      {cell(left.hours, "часов", "countdown-hours")}
      {cell(left.minutes, "минут", "countdown-minutes")}
      {cell(left.seconds, "секунд", "countdown-seconds")}
    </div>
  );
}
