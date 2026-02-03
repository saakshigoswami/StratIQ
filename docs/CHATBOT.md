# Coach Assistant Chatbot

The **Coach Assistant** is an in-dashboard chatbot that answers coaching and analytics questions using **only** your project data and backend logic. It is **not** a generic LLM — it is deterministic and data-driven.

## How It Works

1. **User asks a question** in the chat panel (e.g. "Who performed best in early game?").
2. **Backend** receives `POST /chat/query` with `{ "question": string }` and optional `game=valorant|lol`.
3. **Intent classification** (keyword/pattern-based, no external LLM) maps the question to an intent:
   - `phase_best_player` — Who performed best in early/mid/late?
   - `phase_comparison` — Compare performance across early, mid, late
   - `map_insight` — Which map favors aggressive play?
   - `match_insights` — Show insights for match m1
   - `phase_issues` — What went wrong in late game?
   - `player_summary` — List players and suggest specific questions
   - `unknown` — Fallback with suggested question types
4. **Query execution** calls existing analytics:
   - `load_match_stats`, `get_players`, `phase_stats`, `baseline_vs_recent`
   - `generate_macro_review`, `detect_deviations`, `phase_deviations`
5. **Response** is built from that data and returned as:
   ```json
   { "answer": string, "metrics_used": string[], "confidence": number }
   ```
6. **Frontend** displays the answer in the chat UI with optional confidence and metrics used.

If a question cannot be answered from the data, the assistant responds with: *"I don't have enough data for that yet, but here's what I can tell you..."* and suggests supported question types.

## Example Questions to Test

- **Who performed best in early game?**
- **Compare player performance across early, mid, late game**
- **Which map favors aggressive play?**
- **Show insights for match m1**
- **What went wrong in late game?**
- **Who did best in mid game?**
- **Insights for match m2**
- **What went wrong in early game?**

## Architecture

- **Backend:** `app/chat/` — `intent.py` (classification), `query.py` (execute + build answer). `main.py` exposes `POST /chat/query`.
- **Frontend:** `CoachAssistant.tsx` — message list, input, send button, loading state; calls `chatQuery(question, game)` from `api.ts`.
- **UI:** Floating chat button (bottom-right) opens the Coach Assistant panel; minimal, coach-friendly layout.

## Code Style

- Modular and readable; intent classification and response generation are commented.
- Reuses existing analytics utilities (`get_df`, `phase_stats`, `generate_macro_review`, etc.).
- No external LLM APIs; no claims of using JetBrains AI inside the product.
