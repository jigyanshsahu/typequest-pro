import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import Groq from "groq-sdk";
import { TopicSelection } from "@/components/TopicSelection";
import { TypingInterface } from "@/components/TypingInterface";
import { ResultsScreen } from "@/components/ResultsScreen";
import { HistoryScreen } from "@/components/HistoryScreen";
import { useTypingGame } from "@/hooks/useTypingGame";
import { usePreferences } from "@/hooks/usePreferences";
import { useHistory } from "@/hooks/useHistory";
import { useAchievements } from "@/hooks/useAchievements";
import type { Achievement } from "@/hooks/useAchievements";

type Screen = "topic" | "typing" | "results" | "history";

const GROQ_MODEL = "openai/gpt-oss-120b";

// Lazy singleton Groq client
let _groq: Groq | null = null;
function getGroqClient(): Groq {
  if (!_groq) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("Groq API key is missing. Please add VITE_GROQ_API_KEY to your .env file.");
    _groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _groq;
}

// Determine target word count for the paragraph
function getWordCount(gameMode: string, wordGoal: number, duration: number): number {
  if (gameMode === "words") return wordGoal;
  if (gameMode === "timed") return Math.max(40, Math.ceil((duration / 60) * 70));
  return 80;
}

// Build the educational prompt
function buildPrompt(topic: string, wordCount: number, difficulty: string, punctuation: boolean, numbers: boolean): string {
  const difficultyGuide =
    difficulty === "easy"
      ? "Use very simple vocabulary and short sentences. Target elementary school level. Common everyday words only."
      : difficulty === "hard"
      ? "Use advanced, academic vocabulary and complex sentence structures. Target university level. Include technical terminology."
      : "Use clear, standard vocabulary with moderate complexity. Target high school level. Mix of common and moderately advanced words.";

  const formatRules = [
    "- Use lowercase text only",
    "- No emojis, no markdown",
    "- No headings or bullet points",
    "- Output a single continuous paragraph",
    "- No extra explanation outside the paragraph",
    "- Do not start with 'sure' or any preamble"
  ];

  if (!punctuation) {
    formatRules.push("- Do not use any punctuation (no periods, no commas, no dashes)");
  } else {
    formatRules.push("- Include proper punctuation (periods, commas)");
  }

  if (!numbers) {
    formatRules.push("- Do not use any numbers or digits");
  } else {
    formatRules.push("- You may use numbers where relevant");
  }

  return `You are an educational content generator for a typing practice application.

Your goal is to help students revise concepts while practicing typing.

Input:
- Topic: ${topic}
- Word count: approximately ${wordCount} words

Instructions:
- Write a clear, complete, exam-style definition or explanation of the topic "${topic}"
- Keep the explanation concise but meaningful
- Use simple, easy-to-understand English
- Ensure the answer feels like it comes from a textbook
- Maintain logical flow and clarity
- The content MUST be specifically about "${topic}" — do not write about anything else

Difficulty level: ${difficulty}
${difficultyGuide}

Formatting rules:
${formatRules.join("\n")}

Quality:
- The content should help revision for exams
- Avoid vague or generic sentences
- Make it informative and engaging
- Every sentence should add value about ${topic}

Output only the paragraph, nothing else.`;
}


// Fetch text from Groq using the official SDK
async function fetchFromGroq(prompt: string): Promise<string> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "You are an educational content generator for a typing practice application. Output ONLY the requested paragraph. No preamble, no thinking, no explanation." },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 800,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  console.log("[Groq finish_reason]", completion.choices[0]?.finish_reason);
  console.log("[Groq raw preview]", JSON.stringify(content.substring(0, 300)));
  return content;
}

// Clean Groq response into typeable text
function cleanResponse(raw: string, punctuation: boolean, numbers: boolean): string {
  let cleaned = raw;

  // Strip <think>...</think> blocks (with or without closing tag)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // If an unclosed <think> block exists, strip everything from it onwards
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, "");

  // Collapse newlines to spaces
  cleaned = cleaned.replace(/[\r\n]+/g, " ");

  // Remove common preamble phrases the model might prepend
  cleaned = cleaned.replace(/^(sure[,!.]?\s*|here (is|are)[^:]*:\s*|certainly[,!.]?\s*|of course[,!.]?\s*)/i, "");

  let allowed = "a-zA-Z\\s";
  if (punctuation) allowed += ".,;:!?'\"\\-";
  if (numbers) allowed += "0-9";

  const regex = new RegExp(`[^${allowed}]`, "g");
  cleaned = cleaned.replace(regex, "");
  
  return cleaned
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("topic");
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [resultSaved, setResultSaved] = useState(false);

  const { prefs, update, reset: resetPrefs } = usePreferences();
  const historyHook = useHistory();
  const { checkAchievements, allAchievements, unlockedCount, totalCount } = useAchievements();

  const gameDuration = prefs.gameMode === "timed" ? prefs.duration : 9999;
  const game = useTypingGame(text, gameDuration, prefs.targetWpm);

  const handleStart = useCallback(async (t: string) => {
    setIsLoading(true);
    setTopic(t);
    setResultSaved(false);
    setNewAchievements([]);

    const wordCount = getWordCount(prefs.gameMode, prefs.wordGoal, prefs.duration);
    const prompt = buildPrompt(t, wordCount, prefs.difficulty, prefs.punctuation, prefs.numbers);

    try {
      let raw = await fetchFromGroq(prompt);
      console.log("[Groq raw preview]:", JSON.stringify(raw?.substring(0, 300)));
      let cleaned = cleanResponse(raw, prefs.punctuation, prefs.numbers);
      console.log("[Groq cleaned preview]:", JSON.stringify(cleaned?.substring(0, 300)));

      // Retry once if response is too short after cleaning
      if (cleaned.split(" ").filter(Boolean).length < 20) {
        raw = await fetchFromGroq(prompt);
        console.log("[Groq retry raw preview]:", JSON.stringify(raw?.substring(0, 300)));
        cleaned = cleanResponse(raw, prefs.punctuation, prefs.numbers);
        console.log("[Groq retry cleaned preview]:", JSON.stringify(cleaned?.substring(0, 300)));
      }

      if (!cleaned || cleaned.split(" ").filter(Boolean).length < 5) {
        throw new Error("Groq returned an incomplete response. Please try again.");
      }

      setText(cleaned);
      setScreen("typing");
    } catch (e) {
      if (e instanceof TypeError && e.message.includes("fetch")) {
        toast.error("Failed to connect to Groq API. Please check your internet connection.");
      } else {
        toast.error(e instanceof Error ? e.message : "Failed to generate text");
      }
    } finally {
      setIsLoading(false);
    }
  }, [prefs.gameMode, prefs.wordGoal, prefs.duration, prefs.difficulty, prefs.punctuation, prefs.numbers]);

  const handleTryAgain = useCallback(() => {
    game.reset();
    setResultSaved(false);
    setNewAchievements([]);
    setScreen("typing");
  }, [game]);

  const handleNewTopic = useCallback(() => {
    setText("");
    setResultSaved(false);
    setNewAchievements([]);
    setScreen("topic");
  }, []);

  // Save result and check achievements when transitioning to results
  useEffect(() => {
    if (screen === "results" && !resultSaved && game.wpm > 0) {
      const result = historyHook.addResult({
        topic,
        wpm: game.wpm,
        accuracy: game.accuracy,
        correctWords: game.correctWords,
        incorrectWords: game.incorrectWords,
        difficulty: prefs.difficulty,
        gameMode: prefs.gameMode,
        duration: prefs.duration,
      });

      // Check for new achievements
      const unlocked = checkAchievements([result, ...historyHook.history], result);
      if (unlocked.length > 0) {
        setNewAchievements(unlocked);
        toast.success(`🏆 ${unlocked.length} new achievement${unlocked.length > 1 ? "s" : ""} unlocked!`);
      }

      setResultSaved(true);
    }
  }, [screen, resultSaved, game.wpm, game.accuracy, game.correctWords, game.incorrectWords, topic, prefs.difficulty, prefs.gameMode, prefs.duration, historyHook, checkAchievements]);

  // Auto-switch to results when game finishes
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

  if (screen === "history") {
    return (
      <HistoryScreen
        history={historyHook.history}
        bestWpm={historyHook.bestWpm}
        avgWpm={historyHook.avgWpm}
        avgAccuracy={historyHook.avgAccuracy}
        totalTests={historyHook.totalTests}
        bestByTopic={historyHook.bestByTopic}
        wpmOverTime={historyHook.wpmOverTime}
        achievements={allAchievements}
        unlockedCount={unlockedCount}
        totalAchievementCount={totalCount}
        onBack={() => setScreen("topic")}
        onClearHistory={historyHook.clearHistory}
      />
    );
  }

  if (screen === "topic") {
    return (
      <TopicSelection
        onStart={handleStart}
        isLoading={isLoading}
        prefs={prefs}
        onUpdatePref={update}
        onResetPrefs={resetPrefs}
        onShowHistory={() => setScreen("history")}
        totalTests={historyHook.totalTests}
        bestWpm={historyHook.bestWpm}
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
        newAchievements={newAchievements}
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
