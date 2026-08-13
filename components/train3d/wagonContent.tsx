"use client";

import { useState, type ReactNode } from "react";
import { siteContent } from "@/content/site";

// Наполнение вагонов вынесено сюда, чтобы менять тексты/карточки, не трогая 3D.
// Тексты взяты из дизайн-концепта «Глубина» и content/site.ts.
//
// Стандарт наполнения: статичный контент «нарисован краской» на стене
// (wallPaint.ts) — он всегда на стене, его заслоняют объекты; живым DOM
// остаётся только интерактив (кнопки, ссылки, формы) + sr-only дубли
// заголовков для семантики/SEO.
//
// onDeeper — переход в следующий вагон, onGoTo — прыжок в произвольный.

export type WagonDef = {
  num: string; // «00», «01» — для шапки
  label: string; // короткое имя раздела
  Content: (props: {
    onDeeper: () => void;
    onGoTo: (index: number) => void;
  }) => ReactNode;
};

// Демо брони места (вагон 02): мини-схема зала, выбор места и CTA к форме.
// Настоящая бронь появится с интеграцией Gizmo (Этап 2) — пока собираем заявки.
function SeatMapDemo({ onGoTo }: { onGoTo: (index: number) => void }) {
  const [seat, setSeat] = useState<string | null>(null);
  const rows = ["A", "B"];
  const cols = [1, 2, 3, 4, 5];

  return (
    <div
      style={{ transform: "translate(-430px, 20px)" }}
      className="pointer-events-auto w-[300px] border border-line bg-ink/85 p-5 backdrop-blur"
    >
      <div className="font-display text-xs uppercase tracking-[0.3em] text-acid">
        Бронь места · демо
      </div>
      <p className="mt-2 text-xs leading-snug text-muted">
        Зал «Стандарт». Выбери место — бронь заработает к открытию, пока
        оставь заявку.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r} className="flex items-center gap-2">
            <span className="w-4 font-display text-xs text-muted">{r}</span>
            {cols.map((c) => {
              const id = `${r}${c}`;
              const active = seat === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSeat(active ? null : id)}
                  aria-pressed={active}
                  title={`Место ${id}`}
                  className={
                    "h-9 w-9 border font-display text-xs transition-colors " +
                    (active
                      ? "border-acid bg-acid text-ink"
                      : "border-line bg-ink-soft text-muted hover:border-acid/60")
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={!seat}
        onClick={() => onGoTo(7)}
        className="mt-4 w-full bg-acid px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-ink disabled:opacity-40"
      >
        {seat ? `Забронировать ${seat} →` : "Выбери место"}
      </button>
    </div>
  );
}

// Форма предрегистрации на стене вагона 07 — тот же контракт, что у 2D-формы
// (POST /api/pre-register: name, contact, website-honeypot).
function WallPreRegisterForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      contact: String(data.get("contact") ?? ""),
      website: String(data.get("website") ?? ""),
    };
    try {
      const res = await fetch("/api/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[220px] w-[300px] flex-col justify-center border border-line border-l-[3px] border-l-acid bg-ink/85 p-6 text-center backdrop-blur">
        <div className="font-display text-4xl text-acid">✓</div>
        <div className="mt-2 font-display text-xl font-bold uppercase text-fog">
          Вы в списке
        </div>
        <p className="mt-1 text-xs text-muted" role="status">
          Напишем, как только откроем двери депо.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-[300px] border border-line border-l-[3px] border-l-acid bg-ink/85 p-6 backdrop-blur"
    >
      <div className="font-display text-lg font-bold uppercase text-fog">
        Узнать об открытии
      </div>
      <label className="mt-3 block font-display text-[10px] uppercase tracking-[0.16em] text-muted">
        Имя
        <input
          name="name"
          required
          placeholder="Как тебя звать"
          className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-fog outline-none placeholder:text-muted/60 focus:border-acid"
        />
      </label>
      <label className="mt-3 block font-display text-[10px] uppercase tracking-[0.16em] text-muted">
        Как связаться
        <input
          name="contact"
          required
          placeholder="Telegram, телефон или e-mail"
          className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-fog outline-none placeholder:text-muted/60 focus:border-acid"
        />
      </label>
      {/* Honeypot: скрыт от людей, ловит ботов. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 w-full bg-acid px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-ink disabled:opacity-60"
      >
        {status === "loading" ? "Отправляем…" : "Предварительная регистрация"}
      </button>
      {status === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          Ошибка отправки. Попробуй ещё раз или напиши в Telegram.
        </p>
      )}
    </form>
  );
}

export const WAGONS: WagonDef[] = [
  {
    num: "00",
    label: "Платформа",
    // Гибрид: статичный текст этого вагона «нарисован краской» на стене
    // (wallPaint.ts) — он всегда на стене, его заслоняют объекты. В DOM
    // остаётся только интерактив: кнопка, сдвинутая под нарисованный текст.
    // Скрытый h1 дублирует заголовок для семантики/SEO.
    Content: ({ onDeeper }) => (
      <div style={{ transform: "translate(-300px, 330px)" }}>
        <h1 className="sr-only">
          Игровой клуб, который идёт по своему маршруту
        </h1>
        <button
          type="button"
          onClick={onDeeper}
          className="bg-acid px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-ink shadow-[0_0_26px_rgba(182,255,26,0.35)]"
        >
          Войти вглубь →
        </button>
      </div>
    ),
  },
  {
    num: "01",
    label: "О клубе",
    Content: () => (
      <h2 className="sr-only">Не зал с компами. Это станция для своих.</h2>
    ),
  },
  {
    num: "02",
    label: "Сетап",
    // Вагон-шоурум: перед стеной стоит ПК-сетап (PCSetup), заголовок нарисован
    // на стене; слева — демо брони места.
    Content: ({ onGoTo }) => (
      <>
        <h2 className="sr-only">Вагон 02 · Шоурум сетапа и бронь места</h2>
        <SeatMapDemo onGoTo={onGoTo} />
      </>
    ),
  },
  {
    num: "03",
    label: "Зоны",
    Content: () => <h2 className="sr-only">Выбери свою зону</h2>,
  },
  {
    num: "04",
    label: "Цены",
    Content: () => <h2 className="sr-only">Билет на заезд — тарифы</h2>,
  },
  {
    num: "05",
    label: "Галерея",
    Content: () => <h2 className="sr-only">Галерея — кадры клуба</h2>,
  },
  {
    num: "06",
    label: "Станция",
    // Табло нарисовано на стене; живой DOM — кнопка карт под ним.
    Content: () => (
      <div style={{ transform: "translate(0px, 330px)" }}>
        <h2 className="sr-only">Как нас найти — конечная станция</h2>
        <a
          href={siteContent.contacts.yandexMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-block bg-acid px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-ink shadow-[0_0_26px_rgba(182,255,26,0.35)]"
        >
          📍 Открыть в Яндекс.Картах
        </a>
      </div>
    ),
  },
  {
    num: "07",
    label: "Контакты",
    // Заголовок краской; ссылки и рабочая форма — живым DOM в две колонки.
    Content: () => (
      <div
        style={{ transform: "translate(0px, 120px)" }}
        className="flex items-start gap-10"
      >
        <h2 className="sr-only">Контакты и предрегистрация</h2>
        <div className="pointer-events-auto flex w-[260px] flex-col gap-3 text-sm">
          <a
            href={siteContent.contacts.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border-b border-line pb-2 text-fog hover:text-acid"
          >
            <span className="font-display text-acid">TG</span> Telegram
          </a>
          <a
            href={siteContent.contacts.vk}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border-b border-line pb-2 text-fog hover:text-acid"
          >
            <span className="font-display text-acid">VK</span> ВКонтакте
          </a>
          <a
            href={`tel:${siteContent.contacts.phone.replace(/[^+\d]/g, "")}`}
            className="flex items-center gap-3 border-b border-line pb-2 text-fog hover:text-acid"
          >
            <span className="font-display text-acid">☎</span>
            {siteContent.contacts.phone}
          </a>
          <div className="flex items-center gap-3 text-muted">
            <span className="font-display text-acid">◎</span>
            {siteContent.contacts.address}
          </div>
        </div>
        <div className="pointer-events-auto">
          <WallPreRegisterForm />
        </div>
      </div>
    ),
  },
];
