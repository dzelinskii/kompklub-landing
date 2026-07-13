import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTrainNavigation } from "@/lib/useTrainNavigation";

describe("useTrainNavigation", () => {
  it("стартует с нулевого вагона", () => {
    const { result } = renderHook(() => useTrainNavigation(4));
    expect(result.current.index).toBe(0);
    expect(result.current.isFirst).toBe(true);
  });

  it("next не выходит за последний вагон", () => {
    const { result } = renderHook(() => useTrainNavigation(2));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    expect(result.current.isLast).toBe(true);
  });

  it("prev не выходит за нулевой вагон", () => {
    const { result } = renderHook(() => useTrainNavigation(3));
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
  });

  it("goTo зажимает индекс в границах", () => {
    const { result } = renderHook(() => useTrainNavigation(3));
    act(() => result.current.goTo(10));
    expect(result.current.index).toBe(2);
    act(() => result.current.goTo(-5));
    expect(result.current.index).toBe(0);
  });
});
