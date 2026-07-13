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
  });

  it("показывает ошибку при неуспешном ответе", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("fail", { status: 500 }));

    render(<PreRegisterForm />);
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Как связаться"), "@ivan");
    await userEvent.click(screen.getByRole("button", { name: /регистрац/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/ошибка/i));
  });
});
