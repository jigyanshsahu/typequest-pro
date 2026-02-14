import { useState, useCallback, useEffect, useRef } from "react";

export interface WpmDataPoint {
  time: number;
  wpm: number;
}

interface TypingGameState {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  correctWords: number;
  incorrectWords: number;
  totalCharsTyped: number;
  correctCharsTyped: number;
  isActive: boolean;
  isFinished: boolean;
  timeLeft: number;
  wpm: number;
  accuracy: number;
  wpmHistory: WpmDataPoint[];
  charStatuses: Record<number, Record<number, "correct" | "incorrect">>;
}

export function useTypingGame(text: string, duration: number, targetWpm: number) {
  const [state, setState] = useState<TypingGameState>({
    words: [],
    currentWordIndex: 0,
    currentInput: "",
    correctWords: 0,
    incorrectWords: 0,
    totalCharsTyped: 0,
    correctCharsTyped: 0,
    isActive: false,
    isFinished: false,
    timeLeft: duration,
    wpm: 0,
    accuracy: 100,
    wpmHistory: [],
    charStatuses: {},
  });

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (text) {
      setState((prev) => ({
        ...prev,
        words: text.split(/\s+/).filter(Boolean),
        currentWordIndex: 0,
        currentInput: "",
        correctWords: 0,
        incorrectWords: 0,
        totalCharsTyped: 0,
        correctCharsTyped: 0,
        isActive: false,
        isFinished: false,
        timeLeft: duration,
        wpm: 0,
        accuracy: 100,
        wpmHistory: [],
        charStatuses: {},
      }));
      startTimeRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [text, duration]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setState((prev) => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
        const newTimeLeft = Math.max(0, duration - elapsed);
        const minutes = elapsed / 60;
        const currentWpm = minutes > 0 ? Math.round(prev.correctCharsTyped / 5 / minutes) : 0;

        if (newTimeLeft <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return {
            ...prev,
            timeLeft: 0,
            isFinished: true,
            isActive: false,
            wpm: currentWpm,
            wpmHistory: [...prev.wpmHistory, { time: elapsed, wpm: currentWpm }],
          };
        }

        const shouldRecord = elapsed % 2 === 0 && (prev.wpmHistory.length === 0 || prev.wpmHistory[prev.wpmHistory.length - 1].time !== elapsed);

        return {
          ...prev,
          timeLeft: newTimeLeft,
          wpm: currentWpm,
          wpmHistory: shouldRecord ? [...prev.wpmHistory, { time: elapsed, wpm: currentWpm }] : prev.wpmHistory,
        };
      });
    }, 200);
  }, [duration]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      setState((prev) => {
        if (prev.isFinished) return prev;

        if (!prev.isActive && e.key.length === 1) {
          startTimer();
          const newCharStatuses = { ...prev.charStatuses };
          const word = prev.words[0];
          if (word) {
            newCharStatuses[0] = { 0: e.key === word[0] ? "correct" : "incorrect" };
          }
          return {
            ...prev,
            isActive: true,
            currentInput: e.key,
            totalCharsTyped: 1,
            correctCharsTyped: e.key === word?.[0] ? 1 : 0,
            accuracy: e.key === word?.[0] ? 100 : 0,
            charStatuses: newCharStatuses,
          };
        }

        if (e.key === " ") {
          e.preventDefault();
          if (prev.currentInput.length === 0) return prev;
          const currentWord = prev.words[prev.currentWordIndex];
          const isCorrect = prev.currentInput === currentWord;
          const nextIndex = prev.currentWordIndex + 1;
          const allDone = nextIndex >= prev.words.length;

          if (allDone) {
            if (timerRef.current) clearInterval(timerRef.current);
          }

          // Keep char statuses for typed chars; untyped chars remain default
          const newCharStatuses = { ...prev.charStatuses };
          // charStatuses for this word already has typed chars; untyped ones have no entry = default opacity

          return {
            ...prev,
            currentWordIndex: nextIndex,
            currentInput: "",
            correctWords: prev.correctWords + (isCorrect ? 1 : 0),
            incorrectWords: prev.incorrectWords + (isCorrect ? 0 : 1),
            isFinished: allDone,
            isActive: !allDone,
          };
        }

        if (e.key === "Backspace") {
          if (prev.currentInput.length === 0) return prev; // Can't go back to previous word
          const newInput = prev.currentInput.slice(0, -1);
          const newCharStatuses = { ...prev.charStatuses };
          const word = prev.words[prev.currentWordIndex];
          const removedCharIndex = prev.currentInput.length - 1;
          const removedChar = prev.currentInput[removedCharIndex];
          
          // Only allow backspace if the last char was incorrect
          if (removedChar === word?.[removedCharIndex]) {
            // Char was correct — don't allow removing it
            return prev;
          }
          
          // Remove the incorrect char status
          if (newCharStatuses[prev.currentWordIndex]) {
            delete newCharStatuses[prev.currentWordIndex][removedCharIndex];
          }
          return { ...prev, currentInput: newInput, charStatuses: newCharStatuses };
        }

        if (e.key.length === 1) {
          const newInput = prev.currentInput + e.key;
          const word = prev.words[prev.currentWordIndex];
          const charIndex = newInput.length - 1;
          const isCharCorrect = e.key === word?.[charIndex];

          const newCharStatuses = { ...prev.charStatuses };
          if (!newCharStatuses[prev.currentWordIndex]) newCharStatuses[prev.currentWordIndex] = {};
          newCharStatuses[prev.currentWordIndex][charIndex] = isCharCorrect ? "correct" : "incorrect";

          const newTotalChars = prev.totalCharsTyped + 1;
          const newCorrectChars = prev.correctCharsTyped + (isCharCorrect ? 1 : 0);

          return {
            ...prev,
            currentInput: newInput,
            totalCharsTyped: newTotalChars,
            correctCharsTyped: newCorrectChars,
            accuracy: Math.round((newCorrectChars / newTotalChars) * 100),
            charStatuses: newCharStatuses,
          };
        }

        return prev;
      });
    },
    [startTimer]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = null;
    setState((prev) => ({
      ...prev,
      currentWordIndex: 0,
      currentInput: "",
      correctWords: 0,
      incorrectWords: 0,
      totalCharsTyped: 0,
      correctCharsTyped: 0,
      isActive: false,
      isFinished: false,
      timeLeft: duration,
      wpm: 0,
      accuracy: 100,
      wpmHistory: [],
      charStatuses: {},
    }));
  }, [duration]);

  return { ...state, reset, targetWpm };
}
