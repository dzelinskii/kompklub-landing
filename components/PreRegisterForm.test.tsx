import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreRegisterForm } from "./PreRegisterForm";

afterEach(() => vi.restoreAllMocks());

describe("PreRegisterForm", () => {
  it("отправляет заявку и показывает успех", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    render(<PreRegisterForm />);
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Как связаться"), "@ivan");
    await userEvent.click(screen.getByRole("button", { name: /регистрац/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/спасибо/i));
    expect(fetchMock).toHaveBeenCalledWith("/api/pre-register", expect.any(Object));
    // Проверяем и содержимое запроса: метод и поля тела (иначе переименование
    // поля не будет поймано тестом).
    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({ method: "POST" });
    expect(JSON.parse(String(init?.body))).toMatchObject({ name: "Иван", contact: "@ivan" });
  });

  it("после успешной отправки переводит фокус на сообщение о результате", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    render(<PreRegisterForm />);
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Как связаться"), "@ivan");
    await userEvent.click(screen.getByRole("button", { name: /регистрац/i }));

    await waitFor(() => expect(document.activeElement).toHaveAttribute("role", "status"));
  });

  it("показывает ошибку при неуспешном ответе", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("fail", { status: 500 }));

    render(<PreRegisterForm />);
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Как связаться"), "@ivan");
    await userEvent.click(screen.getByRole("button", { name: /регистрац/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/ошибка/i));
  });

  it("показывает ошибку при сбое сети", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    render(<PreRegisterForm />);
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Как связаться"), "@ivan");
    await userEvent.click(screen.getByRole("button", { name: /регистрац/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/ошибка/i));
  });
});
