import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { TopicSelection } from "@/components/TopicSelection";
import { TypingInterface } from "@/components/TypingInterface";
import { ResultsScreen } from "@/components/ResultsScreen";
import { useTypingGame } from "@/hooks/useTypingGame";
import { usePreferences } from "@/hooks/usePreferences";

type Screen = "topic" | "typing" | "results";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-text`;

const Index = () => {
  const [screen, setScreen] = useState<Screen>("topic");
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");

  const { prefs, update, reset: resetPrefs } = usePreferences();

  const gameDuration = prefs.gameMode === "timed" ? prefs.duration : 9999;
  const game = useTypingGame(text, gameDuration, prefs.targetWpm);

  const handleStart = useCallback(async (t: string) => {
    setIsLoading(true);
    setTopic(t);

    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic: t, punctuation: prefs.punctuation, numbers: prefs.numbers }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate text");
      }

      const data = await res.json();
      let cleaned = data.text.toLowerCase();
      if (!prefs.punctuation) {
        cleaned = cleaned.replace(/[^a-z0-9\s]/g, "");
      }
      if (!prefs.numbers) {
        cleaned = cleaned.replace(/[0-9]/g, "");
      }
      cleaned = cleaned.replace(/\s+/g, " ").trim();
      setText(cleaned);
      setScreen("typing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate text");
    } finally {
      setIsLoading(false);
    }
  }, [prefs.punctuation, prefs.numbers]);

  const handleTryAgain = useCallback(() => {
    game.reset();
    setScreen("typing");
  }, [game]);

  const handleNewTopic = useCallback(() => {
    setText("");
    setScreen("topic");
  }, []);

  // Auto-switch to results when game finishes (timed mode or all words typed)
  useEffect(() => {
    if (screen === "typing" && game.isFinished) {
      const t = setTimeout(() => setScreen("results"), 300);
      return () => clearTimeout(t);
    }
  }, [screen, game.isFinished]);

  // Word goal mode: finish when word count reached
  useEffect(() => {
    if (screen === "typing" && prefs.gameMode === "words" && game.currentWordIndex >= prefs.wordGoal) {
      const t = setTimeout(() => setScreen("results"), 300);
      return () => clearTimeout(t);
    }
  }, [screen, prefs.gameMode, prefs.wordGoal, game.currentWordIndex]);

  if (screen === "topic") {
    return (
      <TopicSelection
        onStart={handleStart}
        isLoading={isLoading}
        prefs={prefs}
        onUpdatePref={update}
        onResetPrefs={resetPrefs}
      />
    );
  }

  if (screen === "results") {
    return (
      <ResultsScreen
        wpm={game.wpm}
        accuracy={game.accuracy}
        correctWords={game.correctWords}
        incorrectWords={game.incorrectWords}
        wpmHistory={game.wpmHistory}
        targetWpm={prefs.targetWpm}
        topic={topic}
        text={text}
        onTryAgain={handleTryAgain}
        onNewTopic={handleNewTopic}
      />
    );
  }

  return (
    <TypingInterface
      words={game.words}
      currentWordIndex={game.currentWordIndex}
      currentInput={game.currentInput}
      charStatuses={game.charStatuses}
      timeLeft={game.timeLeft}
      wpm={game.wpm}
      accuracy={game.accuracy}
      isActive={game.isActive}
      targetWpm={prefs.targetWpm}
      onLogoClick={handleNewTopic}
      gameMode={prefs.gameMode}
      fontSize={prefs.fontSize}
      caretStyle={prefs.caretStyle}
      showGhostCaret={prefs.showGhostCaret}
      smoothCaret={prefs.smoothCaret}
      wordGoal={prefs.wordGoal}
    />
  );
};

export default Index;
