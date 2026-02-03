# Assistant Coach — Cloud9 × JetBrains Hackathon MVP

**Category 1: Comprehensive Assistant Coach**  
Sky's the Limit — Cloud9 × JetBrains Hackathon

---

## Hackathon context

This project is built for the **Cloud9 × JetBrains “Sky’s the Limit” Hackathon** (esports-focused). It targets **Category 1 — Comprehensive Assistant Coach**: an AI/data-driven assistant that analyzes esports match data and provides **actionable coaching insights** (not just raw stats or dashboards).

- **Judges** look for tools that help coaches and players make better decisions.
- **Insight quality and clarity** matter more than technical complexity.
- **Practical, explainable, and demo-friendly** output is key.

---

## Problem being solved

Coaches have **large amounts of match data but limited time**. They need:

- **Which players are underperforming** relative to their own baseline  
- **When performance drops happen** (game phase, map, time)  
- **Plain-English coaching recommendations** they can act on

This MVP addresses that by:

1. **Comparing recent performance vs baseline** (last N matches vs earlier matches)  
2. **Detecting performance drops or trends** (e.g. mid-game damage down 20%)  
3. **Outputting coaching recommendations** that read like advice a real coach could use

---

## How coaches use the tool

1. **Open the web app** (local or deployed).  
2. **Select a player** from the dropdown (e.g. oxy, leaf, jake, vanity, zombs).  
3. **View performance charts** — baseline vs recent by game phase (early / mid / late) for damage and KAST.  
4. **Read coaching insights** — each insight has:
   - **Data:** short, data-backed fact (e.g. “oxy’s mid-game damage dropped by 20% vs baseline”).
   - **Advice:** plain-English recommendation (e.g. “Consider comp adjustments or mid-game role assignments to get them more involved in key fights.”).

No authentication or real-time ingestion; the focus is on **clear, actionable insights** from historical/sample match data.

---

## Tech stack

- **Backend:** Python 3.10+, FastAPI  
- **Data:** pandas, numpy, scikit-learn (lightweight analysis)  
- **Frontend:** HTML/JS, Chart.js  
- **Data source:** CSV (demo dataset in `data/match_stats.csv`); JSON supported via loader

---

## Project structure

```
JETBRAIN_COACH/
├── app/
│   ├── main.py           # FastAPI app, routes, static serve
│   ├── data/
│   │   └── loader.py     # Load match stats (CSV/JSON)
│   ├── features/
│   │   └── extraction.py # Baseline vs recent, phase stats, rolling averages
│   ├── analysis/
│   │   └── deviations.py # Detect significant deviations and phase-level drops
│   └── insights/
│       └── recommendations.py # Plain-English coaching recommendations
├── data/
│   └── match_stats.csv   # Demo match/player stats (VALORANT-style)
├── static/
│   └── index.html        # Web UI: player dropdown, charts, insights panel
├── requirements.txt
└── README.md
```

---

## Running locally

1. **Create a virtual environment** (recommended):

   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate  # macOS/Linux
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server:**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Or: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

4. **Open in browser:**  
   [http://localhost:8000](http://localhost:8000)

---

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Serves the web UI (index.html) |
| `GET /players` | List players (for dropdown) |
| `GET /analysis/{player_id}` | Baseline vs recent, phase stats, deviations, chart-ready series |
| `GET /recommendations/{player_id}` | Coaching recommendations (data + insight text) |

---

## Demo dataset

`data/match_stats.csv` contains **VALORANT-style** match data:

- **Players:** oxy, leaf, jake, vanity, zombs  
- **Matches:** m1–m5 (m5 = most recent)  
- **Maps:** Ascent, Haven, Split  
- **Phases:** early, mid, late  
- **Metrics:** kills, deaths, assists, damage_dealt, kast, rounds_played, rounds_won, first_bloods, multi_kills  

Baseline = older matches; recent = last 2 matches. The analysis and recommendations are derived from comparing these two windows.

---

## JetBrains tools

Development and debugging were done with **PyCharm** and **JetBrains AI** (code completion, refactoring, and navigation). The codebase is structured to work well with PyCharm’s run configurations and the built-in FastAPI support.

---

## Hackathon links

- [Submission specifics (Category 1)](https://cloud9.devpost.com/details/submissionspecifics#h_5750013452471763485843687)  
- [Hackathon rules](https://cloud9.devpost.com/rules)

---

## License

MIT — built for the Cloud9 × JetBrains Hackathon.
