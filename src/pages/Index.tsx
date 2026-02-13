import { useState, useCallback } from "react";
import { toast } from "sonner";
import { TopicSelection } from "@/components/TopicSelection";
import { TypingInterface } from "@/components/TypingInterface";
import { ResultsScreen } from "@/components/ResultsScreen";
import { useTypingGame } from "@/hooks/useTypingGame";

type Screen = "topic" | "typing" | "results";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-text`;

const Index = () => {
  const [screen, setScreen] = useState<Screen>("topic");
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(30);
  const [targetWpm, setTargetWpm] = useState(60);

  const game = useTypingGame(text, duration, targetWpm);

  const handleStart = useCallback(async (t: string, dur: number, wpm: number) => {
    setIsLoading(true);
    setTopic(t);
    setDuration(dur);
    setTargetWpm(wpm);

    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic: t }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate text");
      }

      const data = await res.json();
      // Normalize: lowercase, strip special chars, only letters and spaces
      const cleaned = data.text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      setText(cleaned);
      setScreen("typing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate text");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTryAgain = useCallback(() => {
    game.reset();
    setScreen("typing");
  }, [game]);

  const handleNewTopic = useCallback(() => {
    setText("");
    setScreen("topic");
  }, []);

  // Auto-switch to results when game finishes
  if (screen === "typing" && game.isFinished) {
    setTimeout(() => setScreen("results"), 100);
  }

  if (screen === "topic") {
    return <TopicSelection onStart={handleStart} isLoading={isLoading} />;
  }

  if (screen === "results") {
    return (
      <ResultsScreen
        wpm={game.wpm}
        accuracy={game.accuracy}
        correctWords={game.correctWords}
        incorrectWords={game.incorrectWords}
        wpmHistory={game.wpmHistory}
        targetWpm={targetWpm}
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
    />
  );
};

export default Index;
