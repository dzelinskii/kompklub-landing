import { describe, it, expect } from "vitest";
import { siteContent } from "@/content/site";

describe("модель контента", () => {
  it("содержит все зоны клуба", () => {
    const ids = siteContent.zones.map((z) => z.id);
    expect(ids).toEqual(["pc", "vip", "console", "private", "bar"]);
  });

  it("у каждой зоны есть заголовок и описание", () => {
    for (const zone of siteContent.zones) {
      expect(zone.title.length).toBeGreaterThan(0);
      expect(zone.description.length).toBeGreaterThan(0);
    }
  });

  it("содержит контакты и ссылку на Яндекс.Карты", () => {
    expect(siteContent.contacts.telegram).toMatch(/^https?:\/\//);
    expect(siteContent.contacts.yandexMapsUrl).toMatch(/^https?:\/\//);
  });
});
