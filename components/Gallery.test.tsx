import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Gallery } from "./Gallery";
import { siteContent } from "@/content/site";

describe("Gallery", () => {
  it("рендерит по изображению на каждый элемент галереи", () => {
    render(<Gallery />);
    expect(screen.getAllByRole("img")).toHaveLength(siteContent.gallery.length);
  });
});
