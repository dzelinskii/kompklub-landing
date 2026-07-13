import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroTeaser } from "./HeroTeaser";

describe("HeroTeaser", () => {
  it("показывает заголовок «скоро отправление» и отсчёт", () => {
    render(<HeroTeaser />);
    expect(screen.getByRole("heading", { name: /скоро отправление/i })).toBeInTheDocument();
    expect(screen.getByTestId("countdown-days")).toBeInTheDocument();
  });
});
