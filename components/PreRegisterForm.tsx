"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function PreRegisterForm() {
  const [status, setStatus] = useState<Status>("idle");

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
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-sm">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Имя
        <input
          name="name"
          required
          className="bg-ink-soft border border-line px-3 py-2 text-fog focus:border-acid outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Как связаться
        <input
          name="contact"
          required
          placeholder="Telegram или телефон"
          className="bg-ink-soft border border-line px-3 py-2 text-fog focus:border-acid outline-none"
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
        className="bg-acid text-ink font-display uppercase px-5 py-2 disabled:opacity-60"
      >
        {status === "loading" ? "Отправляем…" : "Предварительная регистрация"}
      </button>
      {status === "success" && (
        <p role="status" className="text-acid text-sm">
          Спасибо! Мы напишем, когда откроемся.
        </p>
      )}
      {status === "error" && (
        <p role="status" className="text-red-400 text-sm">
          Ошибка отправки. Попробуйте ещё раз или напишите нам в Telegram.
        </p>
      )}
    </form>
  );
}
