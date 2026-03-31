import { useRef, useCallback, useState } from "react";
import { Keyboard, RotateCcw, Sparkles, Share2, Download, Trophy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { WpmDataPoint } from "@/hooks/useTypingGame";
import type { Achievement } from "@/hooks/useAchievements";

interface ResultsScreenProps {
  wpm: number;
  accuracy: number;
  correctWords: number;
  incorrectWords: number;
  wpmHistory: WpmDataPoint[];
  targetWpm: number;
  topic: string;
  text: string;
  onTryAgain: () => void;
  onNewTopic: () => void;
  newAchievements: Achievement[];
}

// Generate a shareable image using Canvas API
function generateShareImage(wpm: number, accuracy: number, topic: string): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 420;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, 800, 420);

    // Subtle border
    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 798, 418);

    // Logo
    ctx.font = "bold 28px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("typequest", 400, 55);

    // Divider
    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 80);
    ctx.lineTo(600, 80);
    ctx.stroke();

    // WPM — big hero number
    ctx.font = "bold 96px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${wpm}`, 400, 185);

    ctx.font = "400 16px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#737373";
    ctx.fillText("words per minute", 400, 215);

    // Stats row
    ctx.font = "bold 32px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${accuracy}%`, 300, 280);

    ctx.font = "400 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#737373";
    ctx.fillText("accuracy", 300, 305);

    // Topic
    ctx.font = "bold 32px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(topic.length > 15 ? topic.slice(0, 15) + "..." : topic, 500, 280);

    ctx.font = "400 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#737373";
    ctx.fillText("topic", 500, 305);

    // Divider
    ctx.strokeStyle = "#262626";
    ctx.beginPath();
    ctx.moveTo(200, 340);
    ctx.lineTo(600, 340);
    ctx.stroke();

    // Footer
    ctx.font = "400 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#525252";
    ctx.fillText("typequest pro — learn while you type", 400, 380);

    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png");
  });
}

export function ResultsScreen({
  wpm,
  accuracy,
  correctWords,
  incorrectWords,
  wpmHistory,
  targetWpm,
  topic,
  text,
  onTryAgain,
  onNewTopic,
  newAchievements,
}: ResultsScreenProps) {
  const hitTarget = wpm >= targetWpm;
  const totalWords = correctWords + incorrectWords;
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "downloaded">("idle");

  const handleShare = useCallback(async () => {
    try {
      const blob = await generateShareImage(wpm, accuracy, topic);

      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "typequest-results.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `TypeQuest Pro — ${wpm} WPM on ${topic}`,
            files: [file],
          });
          return;
        }
      }

      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 2000);
      } catch {
        // Final fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "typequest-results.png";
        a.click();
        URL.revokeObjectURL(url);
        setShareStatus("downloaded");
        setTimeout(() => setShareStatus("idle"), 2000);
      }
    } catch (e) {
      console.error("Share failed:", e);
    }
  }, [wpm, accuracy, topic]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 animate-in fade-in duration-500">
      {/* Logo - top right */}
      <button
        onClick={onNewTopic}
        className="absolute top-6 right-6 flex items-center gap-2 transition-opacity hover:opacity-70"
      >
        <Keyboard className="h-5 w-5 text-primary" />
        <span className="font-sans text-lg font-bold text-foreground">
          type<span className="text-primary">quest</span>
        </span>
      </button>

      <div className="w-full max-w-2xl space-y-8">
        {/* Title */}
        <div className="text-center">
          <h2 className="font-sans text-3xl font-bold text-foreground">results</h2>
          <p className="mt-1 text-muted-foreground">topic: {topic}</p>
        </div>

        {/* Big WPM display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-primary">{wpm}</div>
          <div className="text-sm text-muted-foreground mt-1">words per minute</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "accuracy", value: `${accuracy}%`, color: "text-foreground" },
            { label: "correct", value: correctWords, color: "text-success" },
            { label: "incorrect", value: incorrectWords, color: "text-destructive" },
            { label: "total", value: totalWords, color: "text-muted-foreground" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4 text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Target hit */}
        {hitTarget && (
          <div className="flex items-center justify-center gap-2 text-success animate-in zoom-in duration-300">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Target of {targetWpm} WPM achieved!</span>
          </div>
        )}

        {/* New Achievements */}
        {newAchievements.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 animate-in zoom-in duration-500">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-primary">
                {newAchievements.length === 1 ? "New Achievement!" : `${newAchievements.length} New Achievements!`}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {newAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-foreground">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Speed graph */}
        {wpmHistory.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm text-muted-foreground">speed over time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={wpmHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                <XAxis dataKey="time" tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }} tickFormatter={(v) => `${v}s`} />
                <YAxis tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(0, 0%, 45%)" }}
                  itemStyle={{ color: "hsl(0, 0%, 100%)" }}
                  labelFormatter={(v) => `${v}s`}
                />
                <ReferenceLine y={targetWpm} stroke="hsl(0, 0%, 30%)" strokeDasharray="5 5" label={{ value: "target", fill: "hsl(0, 0%, 40%)", fontSize: 12 }} />
                <Line type="monotone" dataKey="wpm" stroke="hsl(0, 0%, 100%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Text review */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm text-muted-foreground">text you typed</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={onTryAgain}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 text-foreground transition-all hover:border-primary hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            try again
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-3 text-foreground transition-all hover:border-primary hover:scale-[1.02] active:scale-[0.98]"
          >
            {shareStatus === "copied" ? (
              <><Sparkles className="h-4 w-4 text-success" /> copied!</>
            ) : shareStatus === "downloaded" ? (
              <><Download className="h-4 w-4 text-success" /> saved!</>
            ) : (
              <><Share2 className="h-4 w-4" /> share</>
            )}
          </button>
          <button
            onClick={onNewTopic}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          >
            new topic
          </button>
        </div>

        {/* Shortcut hint */}
        <p className="text-center text-xs text-muted-foreground/40">
          <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-xs">tab</kbd>
          {" + "}
          <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-xs">enter</kbd>
          {" — new topic"}
        </p>
      </div>
    </div>
  );
}
