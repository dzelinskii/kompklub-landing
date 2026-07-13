// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import * as notify from "@/lib/preRegister/notify";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/pre-register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/pre-register", () => {
  it("на корректную заявку отвечает 200 и шлёт уведомление", async () => {
    const spy = vi.spyOn(notify, "sendPreRegisterNotification").mockResolvedValue();
    const res = await POST(makeRequest({ name: "Иван", contact: "@ivan" }));
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("на некорректную заявку отвечает 400 и не шлёт уведомление", async () => {
    const spy = vi.spyOn(notify, "sendPreRegisterNotification").mockResolvedValue();
    const res = await POST(makeRequest({ name: "", contact: "" }));
    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("при заполненном honeypot тихо отвечает 200, но не шлёт уведомление", async () => {
    const spy = vi.spyOn(notify, "sendPreRegisterNotification").mockResolvedValue();
    const res = await POST(makeRequest({ name: "Бот", contact: "@bot", website: "http://spam" }));
    expect(res.status).toBe(200);
    expect(spy).not.toHaveBeenCalled();
  });

  it("при ошибке уведомления отвечает 502", async () => {
    vi.spyOn(notify, "sendPreRegisterNotification").mockRejectedValue(new Error("нет сети"));
    const res = await POST(makeRequest({ name: "Иван", contact: "@ivan" }));
    expect(res.status).toBe(502);
  });
});
