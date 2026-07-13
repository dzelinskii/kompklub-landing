import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainProgress } from "./TrainProgress";

describe("TrainProgress", () => {
  it("рисует кнопку на каждый вагон и помечает текущий", () => {
    render(
      <TrainProgress
        labels={["Начало", "О клубе", "Зоны", "Контакты"]}
        current={2}
        onSelect={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[2]).toHaveAttribute("aria-current", "true");
    expect(buttons[2]).toHaveAccessibleName("Зоны");
  });
});
