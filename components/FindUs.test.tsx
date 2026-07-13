import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FindUs } from "./FindUs";
import { siteContent } from "@/content/site";

describe("FindUs", () => {
  it("показывает адрес и ссылку на Яндекс.Карты", () => {
    render(<FindUs />);
    expect(screen.getByText(siteContent.contacts.address)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /яндекс/i });
    expect(link).toHaveAttribute("href", siteContent.contacts.yandexMapsUrl);
  });
});
