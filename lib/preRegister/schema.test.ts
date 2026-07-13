import { describe, it, expect } from "vitest";
import { preRegisterSchema } from "@/lib/preRegister/schema";

describe("preRegisterSchema", () => {
  it("принимает корректную заявку", () => {
    const result = preRegisterSchema.safeParse({ name: "Иван", contact: "@ivan" });
    expect(result.success).toBe(true);
  });

  it("отклоняет пустое имя", () => {
    const result = preRegisterSchema.safeParse({ name: "", contact: "@ivan" });
    expect(result.success).toBe(false);
  });

  it("отклоняет слишком короткий контакт", () => {
    const result = preRegisterSchema.safeParse({ name: "Иван", contact: "a" });
    expect(result.success).toBe(false);
  });

  it("разрешает необязательное honeypot-поле website", () => {
    const result = preRegisterSchema.safeParse({ name: "Иван", contact: "@ivan", website: "спам" });
    expect(result.success).toBe(true);
  });
});
