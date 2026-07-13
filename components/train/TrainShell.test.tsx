import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrainShell } from "./TrainShell";

const cars = [
  { id: "a", label: "Вагон A", content: <p>Контент A</p> },
  { id: "b", label: "Вагон B", content: <p>Контент B</p> },
  { id: "c", label: "Вагон C", content: <p>Контент C</p> },
];

afterEach(() => vi.unstubAllGlobals());

describe("TrainShell", () => {
  it("держит контент всех вагонов в DOM (важно для SEO)", () => {
    render(<TrainShell mode="teaser" cars={cars} />);
    expect(screen.getByText("Контент A")).toBeInTheDocument();
    expect(screen.getByText("Контент B")).toBeInTheDocument();
    expect(screen.getByText("Контент C")).toBeInTheDocument();
  });

  it("в режиме teaser показывает кнопку предрегистрации", () => {
    render(<TrainShell mode="teaser" cars={cars} />);
    expect(screen.getByRole("link", { name: /предварительная регистрация/i })).toBeInTheDocument();
  });

  it("в режиме live показывает кнопку бронирования", () => {
    render(<TrainShell mode="live" cars={cars} />);
    expect(screen.getByRole("link", { name: /забронировать/i })).toBeInTheDocument();
  });

  it("кнопка «следующий вагон» продвигает индикатор", async () => {
    render(<TrainShell mode="teaser" cars={cars} />);
    await userEvent.click(screen.getByRole("button", { name: /следующий вагон/i }));
    expect(screen.getByRole("button", { name: "Вагон B" })).toHaveAttribute("aria-current", "true");
  });

  it("в компактном режиме показывает вагоны стопкой без индикатора и контролов", () => {
    // Имитируем узкий экран / reduced-motion: matchMedia сообщает matches=true.
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    render(<TrainShell mode="teaser" cars={cars} />);

    // Контент всех вагонов всё так же в DOM.
    expect(screen.getByText("Контент A")).toBeInTheDocument();
    expect(screen.getByText("Контент C")).toBeInTheDocument();
    // Индикатор-схема и кнопки перелистывания в компактном режиме не рендерятся.
    expect(screen.queryByRole("list", { name: /схема поезда/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /следующий вагон/i })).not.toBeInTheDocument();
  });
});
