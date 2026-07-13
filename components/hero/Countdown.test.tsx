import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Countdown } from "./Countdown";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Countdown", () => {
  it("показывает количество дней до целевой даты", () => {
    vi.setSystemTime(new Date("2026-08-30T18:00:00+03:00"));
    render(<Countdown targetDate="2026-09-01T18:00:00+03:00" />);
    // 2 дня до цели
    expect(screen.getByTestId("countdown-days")).toHaveTextContent("2");
  });

  it("после наступления даты показывает нули", () => {
    vi.setSystemTime(new Date("2026-09-02T18:00:00+03:00"));
    render(<Countdown targetDate="2026-09-01T18:00:00+03:00" />);
    expect(screen.getByTestId("countdown-days")).toHaveTextContent("0");
  });
});
