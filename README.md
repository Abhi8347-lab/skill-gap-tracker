# SkillPath AI — Skill Gap & Learning Tracker

A multi-page, AI-guided skill gap tracker built with HTML/CSS/JavaScript and a lightweight Flask + SQLite persistence backend (with automatic `localStorage` fallback).

## Multi-Page Flow

1. **Profile Setup (`/` or `index.html`)** — Option-based 4-step wizard (only your name is typed): status & conditional background, career aim, multi-select skills with 1–5 star ratings, experience level, and weekly study hours.
2. **Skill Gap Analyzer (`/analyzer` or `analyzer.html`)** — Personalized AI gap insight, skill-match percentage, interactive Radar & Bar comparison charts, estimated weeks to goal, and an ordered learning roadmap (`Missing`, `Needs Improvement`, `Strong`).
3. **Courses & Progress (`/courses` or `courses.html`)** — Curated courses across CS50 (Harvard), Coursera, freeCodeCamp, YouTube, edX, and Udemy grouped by skill in roadmap order, with live `Not Started → In Progress → Completed` progress tracking that updates skill checkmarks (`Python ✓`, `Streamlit ✓`) and roadmap metrics.

## Quick Start

```bash
python app.py
```

Then open [http://127.0.0.1:5050](http://127.0.0.1:5050) in your browser. All profile data and course progress persist in `skill_tracker.db` (SQLite) and `localStorage`.

## Run Tests

```bash
python -m pytest -v
```
