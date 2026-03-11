import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Keyboard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TypingInterfaceProps {
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  charStatuses: Record<number, Record<number, "correct" | "incorrect">>;
  timeLeft: number;
  wpm: number;
  accuracy: number;
  isActive: boolean;
  targetWpm: number;
  onLogoClick: () => void;
}

const VISIBLE_LINES = 3;
const LINE_HEIGHT_PX = 48;

export function TypingInterface({
  words,
  currentWordIndex,
  currentInput,
  charStatuses,
  timeLeft,
  wpm,
  accuracy,
  isActive,
  targetWpm,
  onLogoClick,
}: TypingInterfaceProps) {
  const [showExitDialog, setShowExitDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const [caretPos, setCaretPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [ghostCaretPos, setGhostCaretPos] = useState<{ left: number; top: number } | null>(null);
  const ghostCharIndexRef = useRef(0);
  const ghostAnimRef = useRef<number | null>(null);
  const ghostStartTimeRef = useRef<number | null>(null);

  // Flatten all characters with their word/char indices for ghost caret positioning
  const flatChars = useRef<{ wi: number; ci: number }[]>([]);
  useEffect(() => {
    const chars: { wi: number; ci: number }[] = [];
    words.forEach((word, wi) => {
      word.split("").forEach((_, ci) => {
        chars.push({ wi, ci });
      });
      // Add a virtual char for the space after each word (except last)
      if (wi < words.length - 1) {
        chars.push({ wi, ci: word.length }); // space position
      }
    });
    flatChars.current = chars;
  }, [words]);

  // Initialize ghost caret at first character position
  useLayoutEffect(() => {
    if (!isActive && innerRef.current && flatChars.current.length > 0) {
      const firstChar = charRefs.current.get("0-0");
      if (firstChar && innerRef.current) {
        const containerRect = innerRef.current.getBoundingClientRect();
        const charRect = firstChar.getBoundingClientRect();
        setGhostCaretPos({
          left: charRect.left - containerRect.left,
          top: charRect.top - containerRect.top,
        });
      }
    }
  }, [isActive, words]);

  // Ghost caret animation: advance at target WPM speed
  useEffect(() => {
    if (!isActive) {
      ghostStartTimeRef.current = null;
      if (ghostAnimRef.current) cancelAnimationFrame(ghostAnimRef.current);
      return;
    }

    if (!ghostStartTimeRef.current) {
      ghostStartTimeRef.current = performance.now();
      ghostCharIndexRef.current = 0;
    }

    const charsPerMs = (targetWpm * 5) / 60 / 1000;

    const tick = (now: number) => {
      const elapsed = now - (ghostStartTimeRef.current || now);
      const expectedChars = Math.floor(elapsed * charsPerMs);
      const clampedIndex = Math.min(expectedChars, flatChars.current.length - 1);
      ghostCharIndexRef.current = clampedIndex;

      if (innerRef.current && clampedIndex >= 0 && clampedIndex < flatChars.current.length) {
        const { wi, ci } = flatChars.current[clampedIndex];
        const word = words[wi];
        let targetEl: HTMLSpanElement | null = null;

        if (ci < word.length) {
          targetEl = charRefs.current.get(`${wi}-${ci}`) || null;
        }

        if (targetEl && innerRef.current) {
          const containerRect = innerRef.current.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          setGhostCaretPos({
            left: targetRect.left - containerRect.left,
            top: targetRect.top - containerRect.top,
          });
        } else {
          const wordEl = wordRefs.current[wi];
          if (wordEl && innerRef.current) {
            const containerRect = innerRef.current.getBoundingClientRect();
            const wordRect = wordEl.getBoundingClientRect();
            setGhostCaretPos({
              left: wordRect.right - containerRect.left,
              top: wordRect.top - containerRect.top,
            });
          }
        }
      }

      ghostAnimRef.current = requestAnimationFrame(tick);
    };

    ghostAnimRef.current = requestAnimationFrame(tick);
    return () => {
      if (ghostAnimRef.current) cancelAnimationFrame(ghostAnimRef.current);
    };
  }, [isActive, targetWpm, words]);

  // Scroll to keep current word visible
  useEffect(() => {
    const el = wordRefs.current[currentWordIndex];
    if (el && containerRef.current) {
      containerRef.current.scrollTop = Math.max(0, el.offsetTop - 8);
    }
  }, [currentWordIndex]);

  // Update typing caret position
  useLayoutEffect(() => {
    const word = words[currentWordIndex];
    if (!word || !innerRef.current) return;

    const charIndex = currentInput.length;
    let targetEl: HTMLSpanElement | null = null;

    if (charIndex < word.length) {
      targetEl = charRefs.current.get(`${currentWordIndex}-${charIndex}`) || null;
    } else {
      const wordEl = wordRefs.current[currentWordIndex];
      if (wordEl && innerRef.current) {
        const containerRect = innerRef.current.getBoundingClientRect();
        const wordRect = wordEl.getBoundingClientRect();
        setCaretPos({
          left: wordRect.right - containerRect.left,
          top: wordRect.top - containerRect.top,
        });
        return;
      }
    }

    if (targetEl && innerRef.current) {
      const containerRect = innerRef.current.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setCaretPos({
        left: targetRect.left - containerRect.left,
        top: targetRect.top - containerRect.top,
      });
    }
  }, [currentWordIndex, currentInput, words]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const setCharRef = (key: string, el: HTMLSpanElement | null) => {
    if (el) {
      charRefs.current.set(key, el);
    } else {
      charRefs.current.delete(key);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Logo - top right */}
      <button
        onClick={onLogoClick}
        className="absolute top-6 right-6 flex items-center gap-2 transition-opacity hover:opacity-70"
      >
        <Keyboard className="h-5 w-5 text-primary" />
        <span className="font-sans text-lg font-bold text-foreground">
          type<span className="text-primary">learn</span>
        </span>
      </button>

      <div className="w-full max-w-5xl space-y-10">
        {/* Stats bar */}
        <div className="flex items-center justify-between text-base">
          <div className="flex items-center gap-8">
            <span className="text-muted-foreground">
              wpm: <span className="text-3xl font-bold text-foreground">{wpm}</span>
            </span>
            <span className="text-muted-foreground">
              acc: <span className="text-3xl font-bold text-foreground">{accuracy}%</span>
            </span>
          </div>
          <span className={`text-4xl font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse-glow" : "text-foreground"}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Words display - only 3 lines visible */}
        <div
          ref={containerRef}
          className="overflow-hidden rounded-xl border border-border bg-card p-8 text-2xl leading-loose"
          style={{ height: `${VISIBLE_LINES * LINE_HEIGHT_PX + 16}px` }}
        >
          <div ref={innerRef} className="relative flex flex-wrap gap-x-2.5 gap-y-2">
            {/* Ghost caret - moves at target WPM speed */}
            {ghostCaretPos && (
              <span
                className="absolute pointer-events-none z-[9] rounded-full"
                style={{
                  width: "2.5px",
                  height: "1.4em",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  transform: `translate(${ghostCaretPos.left}px, ${ghostCaretPos.top}px)`,
                  transition: "transform 150ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            )}
            {/* Typing caret - follows user input */}
            <span
              className="absolute w-[2px] pointer-events-none z-10 rounded-full"
              style={{
                height: "1.4em",
                backgroundColor: "#ffffff",
                transform: `translate(${caretPos.left}px, ${caretPos.top}px)`,
                transition: "transform 80ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
            {words.map((word, wi) => {
              const isCurrent = wi === currentWordIndex;
              const isPast = wi < currentWordIndex;
              const isFuture = wi > currentWordIndex;

              return (
                <span
                  key={wi}
                  ref={(el) => { wordRefs.current[wi] = el; }}
                  className="relative inline-block"
                >
                  {word.split("").map((char, ci) => {
                    let className = "";

                    if (isFuture) {
                      className = "text-muted-foreground";
                    } else if (isPast) {
                      const status = charStatuses[wi]?.[ci];
                      if (status === "incorrect") {
                        className = "text-destructive";
                      } else if (status === "correct") {
                        className = "text-foreground";
                      } else {
                        className = "text-muted-foreground";
                      }
                    } else if (isCurrent) {
                      const status = charStatuses[wi]?.[ci];
                      if (status === "correct") {
                        className = "text-foreground";
                      } else if (status === "incorrect") {
                        className = "text-destructive";
                      } else {
                        className = "text-muted-foreground";
                      }
                    }

                    return (
                      <span
                        key={ci}
                        ref={(el) => setCharRef(`${wi}-${ci}`, el)}
                        className={className}
                      >
                        {char}
                      </span>
                    );
                  })}
                  {/* Extra typed chars beyond word length */}
                  {isCurrent && currentInput.length > word.length && (
                    <span className="text-destructive">
                      {currentInput.slice(word.length)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        <div className="text-center">
          {!isActive && currentWordIndex === 0 && (
            <p className="animate-pulse-glow text-sm text-muted-foreground">start typing to begin...</p>
          )}
        </div>
      </div>
    </div>
  );
}
