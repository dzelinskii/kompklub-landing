import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch } from "@/lib/api/client";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
});

describe("apiFetch", () => {
  it("бросает ошибку, если базовый URL не задан", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    await expect(apiFetch("/ping")).rejects.toThrow(/API_BASE_URL/);
  });

  it("собирает полный URL и пробрасывает init в fetch", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const init = { method: "POST" };
    await apiFetch("/ping", init);

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/ping", init);
  });

  it("склеивает базу и путь ровно одним слэшем", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await apiFetch("/ping");

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/ping", undefined);
  });

  it("возвращает ответ, который вернул fetch", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await apiFetch("/ping");

    expect(await res.text()).toBe("ok");
  });
});
