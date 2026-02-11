
# ⌨️ TypeLearn — AI-Powered Typing Game

A MonkeyType-inspired typing game that combines typing practice with learning, featuring AI-generated text on any topic you choose.

## Design
- **Dark minimal theme** inspired by MonkeyType — dark background, monospace font, focused and distraction-free
- Clean typography with color-coded feedback (correct = white, incorrect = red, upcoming = gray)

## Flow

### 1. Topic Selection Screen
- Text input where you type any topic (e.g. "quantum physics", "ancient Rome", "machine learning")
- Quick-pick topic chips for popular categories (Science, History, Technology, Literature, Geography)
- Settings panel to customize:
  - **Timer duration**: 15s, 30s, 60s, 90s, or custom
  - **Target WPM speed**: adjustable slider (20–200 WPM)

### 2. Text Generation (Perplexity AI)
- On topic selection, an edge function calls Perplexity API to generate an educational paragraph on the chosen topic
- Loading state while text is fetched
- Text is broken into words for the typing interface

### 3. Typing Interface
- Words displayed in a flowing layout, current word highlighted
- Real-time character-by-character feedback (green for correct, red for incorrect)
- **Countdown timer** at the top showing remaining time
- **Live WPM counter** updating as you type
- **Speed bar** — a horizontal progress bar showing your current WPM relative to your target WPM (moves in real-time)
- Accuracy percentage displayed live

### 4. Results Screen
- Final WPM, accuracy %, correct/incorrect word counts
- Speed graph showing WPM over time during the session
- Topic and text snippet shown for reference
- "Try Again" (same topic) and "New Topic" buttons

## Backend (Lovable Cloud)
- Perplexity connector for AI text generation
- Edge function to generate topic-based typing text
