import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Zones } from "./Zones";
import { siteContent } from "@/content/site";

describe("Zones", () => {
  it("рендерит карточку для каждой зоны", () => {
    render(<Zones />);
    for (const z of siteContent.zones) {
      expect(screen.getByRole("heading", { name: z.title })).toBeInTheDocument();
    }
  });
});
