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

  it("держит все вагоны в DOM в правильном порядке", () => {
    delete process.env.SITE_MODE;
    render(<Home />);
    const ids = Array.from(document.querySelectorAll("[data-car-index]")).map((el) => el.id);
    expect(ids).toEqual(["hero", "about", "zones", "pricing", "gallery", "find-us", "contacts"]);
  });
});
