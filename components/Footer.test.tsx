import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { siteContent } from "@/content/site";

describe("Footer", () => {
  it("показывает контакты Telegram, VK и телефон", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /telegram/i })).toHaveAttribute("href", siteContent.contacts.telegram);
    expect(screen.getByRole("link", { name: /vk/i })).toHaveAttribute("href", siteContent.contacts.vk);
    expect(screen.getByText(siteContent.contacts.phone)).toBeInTheDocument();
  });

  it("содержит форму предрегистрации", () => {
    render(<Footer />);
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
  });
});
