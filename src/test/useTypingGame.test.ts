
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTypingGame } from "../hooks/useTypingGame";

describe("useTypingGame", () => {
  it("initializes correctly", () => {
    const { result } = renderHook(() => useTypingGame("hello world", 60, 40));
    expect(result.current.words).toEqual(["hello", "world"]);
    expect(result.current.timeLeft).toBe(60);
    expect(result.current.isActive).toBe(false);
  });

  it("starts the game on first character", () => {
    const { result } = renderHook(() => useTypingGame("hello world", 60, 40));
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentInput).toBe("h");
    expect(result.current.totalCharsTyped).toBe(1);
  });

  it("handles word completion and accuracy", () => {
    const { result } = renderHook(() => useTypingGame("hello world", 60, 40));
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "l" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "l" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "o" }));
    });

    expect(result.current.currentInput).toBe("hello");
    expect(result.current.accuracy).toBe(100);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    });

    expect(result.current.currentWordIndex).toBe(1);
    expect(result.current.currentInput).toBe("");
    expect(result.current.correctWords).toBe(1);
  });

  it("finishes the game when all words are typed", () => {
    const { result } = renderHook(() => useTypingGame("test", 60, 40));
    
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    });

    expect(result.current.isFinished).toBe(true);
    expect(result.current.isActive).toBe(false);
  });
});
