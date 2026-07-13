import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroLive } from "./HeroLive";

describe("HeroLive", () => {
  it("показывает слоган и кнопку бронирования", () => {
    render(<HeroLive />);
    expect(screen.getByRole("link", { name: /забронировать/i })).toBeInTheDocument();
  });
});
