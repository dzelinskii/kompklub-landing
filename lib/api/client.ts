/**
 * Изолированный слой запросов к будущему Python-API (Этап 2).
 * Сейчас не вызывается; существует, чтобы адрес API и способ вызова
 * были в одном месте и переход на реальный бэкенд не задел вёрстку.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL не задан");
  }
  return fetch(`${base}${path}`, init);
}
