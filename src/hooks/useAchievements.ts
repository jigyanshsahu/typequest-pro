import { useState, useCallback, useEffect } from "react";
import type { TestResult } from "./useHistory";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (results: TestResult[], latest: TestResult) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

const STORAGE_KEY = "typequest-achievements";

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_test",
    title: "First Steps",
    description: "Complete your first typing test",
    icon: "🎯",
    check: (results) => results.length >= 1,
  },
  {
    id: "ten_tests",
    title: "Dedicated Learner",
    description: "Complete 10 typing tests",
    icon: "📚",
    check: (results) => results.length >= 10,
  },
  {
    id: "twenty_five_tests",
    title: "Practice Makes Perfect",
    description: "Complete 25 typing tests",
    icon: "💪",
    check: (results) => results.length >= 25,
  },
  {
    id: "fifty_tests",
    title: "Typing Marathon",
    description: "Complete 50 typing tests",
    icon: "🏃",
    check: (results) => results.length >= 50,
  },
  {
    id: "wpm_40",
    title: "Getting Started",
    description: "Reach 40 WPM in a test",
    icon: "⌨️",
    check: (_, latest) => latest.wpm >= 40,
  },
  {
    id: "wpm_60",
    title: "Keyboard Warrior",
    description: "Reach 60 WPM in a test",
    icon: "⚔️",
    check: (_, latest) => latest.wpm >= 60,
  },
  {
    id: "wpm_80",
    title: "Speed Demon",
    description: "Reach 80 WPM in a test",
    icon: "🚀",
    check: (_, latest) => latest.wpm >= 80,
  },
  {
    id: "wpm_100",
    title: "Century Club",
    description: "Reach 100 WPM in a test",
    icon: "💯",
    check: (_, latest) => latest.wpm >= 100,
  },
  {
    id: "wpm_120",
    title: "Lightning Fingers",
    description: "Reach 120 WPM in a test",
    icon: "⚡",
    check: (_, latest) => latest.wpm >= 120,
  },
  {
    id: "accuracy_95",
    title: "Sharp Shooter",
    description: "Achieve 95% accuracy",
    icon: "🎯",
    check: (_, latest) => latest.accuracy >= 95,
  },
  {
    id: "accuracy_99",
    title: "Perfectionist",
    description: "Achieve 99% accuracy",
    icon: "💎",
    check: (_, latest) => latest.accuracy >= 99,
  },
  {
    id: "accuracy_100",
    title: "Flawless",
    description: "Achieve 100% accuracy",
    icon: "✨",
    check: (_, latest) => latest.accuracy >= 100,
  },
  {
    id: "five_topics",
    title: "Explorer",
    description: "Practice 5 different topics",
    icon: "🗺️",
    check: (results) => {
      const topics = new Set(results.map((r) => r.topic.toLowerCase()));
      return topics.size >= 5;
    },
  },
  {
    id: "hard_mode",
    title: "Challenge Accepted",
    description: "Complete a test on hard difficulty",
    icon: "🔥",
    check: (_, latest) => latest.difficulty === "hard",
  },
  {
    id: "speed_accuracy",
    title: "The Complete Package",
    description: "Get 80+ WPM with 95%+ accuracy",
    icon: "🏆",
    check: (_, latest) => latest.wpm >= 80 && latest.accuracy >= 95,
  },
];

function loadUnlocked(): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to load unlocked achievements", error);
  }
  return [];
}

function saveUnlocked(unlocked: UnlockedAchievement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
}

export function useAchievements() {
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>(loadUnlocked);

  useEffect(() => {
    saveUnlocked(unlocked);
  }, [unlocked]);

  const checkAchievements = useCallback(
    (allResults: TestResult[], latest: TestResult): Achievement[] => {
      const newlyUnlocked: Achievement[] = [];
      const unlockedIds = new Set(unlocked.map((u) => u.id));

      for (const achievement of ACHIEVEMENTS) {
        if (!unlockedIds.has(achievement.id) && achievement.check(allResults, latest)) {
          newlyUnlocked.push(achievement);
        }
      }

      if (newlyUnlocked.length > 0) {
        setUnlocked((prev) => [
          ...prev,
          ...newlyUnlocked.map((a) => ({ id: a.id, unlockedAt: Date.now() })),
        ]);
      }

      return newlyUnlocked;
    },
    [unlocked]
  );

  const unlockedIds = new Set(unlocked.map((u) => u.id));
  const allAchievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedIds.has(a.id),
    unlockedAt: unlocked.find((u) => u.id === a.id)?.unlockedAt,
  }));

  const unlockedCount = unlocked.length;
  const totalCount = ACHIEVEMENTS.length;

  return {
    allAchievements,
    checkAchievements,
    unlockedCount,
    totalCount,
  };
}
