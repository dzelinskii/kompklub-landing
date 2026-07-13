import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrainShell } from "./TrainShell";

const cars = [
  { id: "a", label: "Вагон A", content: <p>Контент A</p> },
  { id: "b", label: "Вагон B", content: <p>Контент B</p> },
  { id: "c", label: "Вагон C", content: <p>Контент C</p> },
];

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
    expect(screen.getByRole("button", { name: "Вагон 2" })).toHaveAttribute("aria-current", "true");
  });
});
