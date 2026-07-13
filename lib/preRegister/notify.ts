import type { PreRegisterInput } from "./schema";

export async function sendPreRegisterNotification(input: PreRegisterInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Telegram не сконфигурирован (нет TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)");
  }

  const text = `Новая предварительная регистрация\nИмя: ${input.name}\nКонтакт: ${input.contact}`;

  // parse_mode не задаём намеренно: Telegram трактует текст как обычный, без
  // разбора Markdown/HTML. Это исключает инъекцию разметки из пользовательского
  // ввода (имя/контакт). Не добавлять parse_mode без экранирования полей.
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API вернул ${res.status}`);
  }
}
