import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

afterEach(() => {
  delete process.env.SITE_MODE;
});

describe("страница лендинга", () => {
  it("в режиме teaser показывает вагон-тизер «скоро отправление»", () => {
    delete process.env.SITE_MODE;
    render(<Home />);
    expect(screen.getByRole("heading", { name: /скоро отправление/i })).toBeInTheDocument();
  });

  it("в режиме live держит вагон «зоны» в DOM", () => {
    process.env.SITE_MODE = "live";
    render(<Home />);
    expect(screen.getByRole("heading", { name: /зоны/i })).toBeInTheDocument();
  });
});
