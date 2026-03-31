import { useState, useCallback, useEffect } from "react";

export interface TestResult {
  id: string;
  topic: string;
  wpm: number;
  accuracy: number;
  correctWords: number;
  incorrectWords: number;
  difficulty: string;
  gameMode: string;
  duration: number;
  timestamp: number;
}

const STORAGE_KEY = "typequest-history";
const MAX_HISTORY = 100;

function loadHistory(): TestResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(history: TestResult[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function useHistory() {
  const [history, setHistory] = useState<TestResult[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addResult = useCallback((result: Omit<TestResult, "id" | "timestamp">) => {
    const newResult: TestResult = {
      ...result,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newResult, ...prev]);
    return newResult;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Stats
  const bestWpm = history.length > 0 ? Math.max(...history.map((r) => r.wpm)) : 0;
  const avgWpm = history.length > 0 ? Math.round(history.reduce((s, r) => s + r.wpm, 0) / history.length) : 0;
  const avgAccuracy = history.length > 0 ? Math.round(history.reduce((s, r) => s + r.accuracy, 0) / history.length) : 0;
  const totalTests = history.length;

  // Best per topic
  const bestByTopic: Record<string, TestResult> = {};
  for (const r of history) {
    const key = r.topic.toLowerCase();
    if (!bestByTopic[key] || r.wpm > bestByTopic[key].wpm) {
      bestByTopic[key] = r;
    }
  }

  // WPM over time (last 20 tests, chronological)
  const wpmOverTime = history
    .slice(0, 20)
    .reverse()
    .map((r, i) => ({
      test: i + 1,
      wpm: r.wpm,
      accuracy: r.accuracy,
    }));

  return {
    history,
    addResult,
    clearHistory,
    bestWpm,
    avgWpm,
    avgAccuracy,
    totalTests,
    bestByTopic,
    wpmOverTime,
  };
}
