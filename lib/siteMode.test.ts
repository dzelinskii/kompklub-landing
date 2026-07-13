import { describe, it, expect, afterEach } from "vitest";
import { getSiteMode } from "@/lib/siteMode";

afterEach(() => {
  delete process.env.SITE_MODE;
});

describe("getSiteMode", () => {
  it("по умолчанию возвращает teaser", () => {
    delete process.env.SITE_MODE;
    expect(getSiteMode()).toBe("teaser");
  });

  it("возвращает live, если задано в окружении", () => {
    process.env.SITE_MODE = "live";
    expect(getSiteMode()).toBe("live");
  });

  it("при некорректном значении откатывается на teaser", () => {
    process.env.SITE_MODE = "нечто";
    expect(getSiteMode()).toBe("teaser");
  });
});
