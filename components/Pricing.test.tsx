import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pricing } from "./Pricing";
import { siteContent } from "@/content/site";

describe("Pricing", () => {
  it("в режиме live показывает тарифы", () => {
    render(<Pricing mode="live" />);
    expect(screen.getByText(siteContent.tariffs[0].title)).toBeInTheDocument();
  });

  it("в режиме teaser при скрытых тарифах показывает «скоро»", () => {
    render(<Pricing mode="teaser" />);
    expect(screen.getByText(/тарифы скоро/i)).toBeInTheDocument();
  });
});
