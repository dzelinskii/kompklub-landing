import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
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

  it("обновляет отсчёт по тику таймера", () => {
    vi.setSystemTime(new Date("2026-09-01T17:59:57+03:00")); // 3 секунды до цели
    render(<Countdown targetDate="2026-09-01T18:00:00+03:00" />);
    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("3");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("1");
  });

  it("при некорректной дате показывает нули, а не NaN", () => {
    render(<Countdown targetDate="не дата" />);
    expect(screen.getByTestId("countdown-days")).toHaveTextContent("0");
    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("0");
  });
});
