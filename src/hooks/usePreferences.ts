import { useState, useEffect, useCallback } from "react";

export type GameMode = "timed" | "practice" | "words";
export type CaretStyle = "bar" | "block" | "underline";
export type FontSize = "small" | "medium" | "large";
export type Difficulty = "easy" | "medium" | "hard";

export interface Preferences {
  // Typing settings
  duration: number;
  targetWpm: number;
  punctuation: boolean;
  numbers: boolean;
  gameMode: GameMode;
  wordGoal: number;
  difficulty: Difficulty;

  // Visual
  fontSize: FontSize;
  caretStyle: CaretStyle;
  showGhostCaret: boolean;
  smoothCaret: boolean;
}

const DEFAULTS: Preferences = {
  duration: 60,
  targetWpm: 60,
  punctuation: false,
  numbers: false,
  gameMode: "timed",
  wordGoal: 50,
  difficulty: "medium",
  fontSize: "medium",
  caretStyle: "bar",
  showGhostCaret: true,
  smoothCaret: true,
};

const STORAGE_KEY = "typelearn-preferences";

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Failed to load preferences", error);
  }
  return { ...DEFAULTS };
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const update = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  const reset = useCallback(() => setPrefs({ ...DEFAULTS }), []);

  return { prefs, update, reset };
}
