import { describe, it, expect, vi, afterEach } from "vitest";
import { sendPreRegisterNotification } from "@/lib/preRegister/notify";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
});

describe("sendPreRegisterNotification", () => {
  it("бросает ошибку, если Telegram не сконфигурирован", async () => {
    await expect(
      sendPreRegisterNotification({ name: "Иван", contact: "@ivan" }),
    ).rejects.toThrow(/Telegram/);
  });

  it("вызывает Telegram API с именем и контактом", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await sendPreRegisterNotification({ name: "Иван", contact: "@ivan" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/botTOKEN/sendMessage");
    expect(String(init?.body)).toContain("Иван");
    expect(String(init?.body)).toContain("@ivan");
  });

  it("бросает ошибку, если Telegram вернул не-2xx", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("fail", { status: 500 }));

    await expect(
      sendPreRegisterNotification({ name: "Иван", contact: "@ivan" }),
    ).rejects.toThrow(/500/);
  });
});
