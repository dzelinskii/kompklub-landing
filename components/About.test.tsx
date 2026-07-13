import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { About } from "./About";
import { siteContent } from "@/content/site";

describe("About", () => {
  it("показывает все преимущества из контента", () => {
    render(<About />);
    for (const f of siteContent.about.features) {
      expect(screen.getByText(f.title)).toBeInTheDocument();
    }
  });
});
