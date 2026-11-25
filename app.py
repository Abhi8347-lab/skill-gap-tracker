"""Flask static server and stateless AI explanation endpoint for SkillSync AI.

All user profiles, scores, and learning progress are stored strictly in browser
localStorage (never in server files or local databases).
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from flask import Flask, abort, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent

PAGE_FILES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/profile": "index.html",
    "/analyzer": "analyzer.html",
    "/analyzer.html": "analyzer.html",
    "/courses": "courses.html",
    "/courses.html": "courses.html",
}


def utc_now_iso() -> str:
    """Return an ISO-8601 UTC timestamp string."""
    return datetime.now(timezone.utc).isoformat()


def build_fallback_explanations(payload: dict[str, Any]) -> dict[str, Any]:
    """Generate deterministic, explainable course rationales when no AI API is used."""
    role_name = str(payload.get("roleName") or "your target role")
    priority = str(payload.get("companyPriority") or "").strip()
    courses = payload.get("courses") or []

    explanations: dict[str, str] = {}
    for item in courses:
        if not isinstance(item, dict):
            continue
        course_id = str(item.get("courseId") or "")
        if not course_id:
            continue
        skill_name = str(item.get("skillName") or "this skill")
        current_pct = int(item.get("currentPct") or 0)
        target_pct = int(item.get("targetPct") or 80)
        is_priority = bool(item.get("isPriorityMatch"))

        if current_pct >= target_pct:
            explanations[course_id] = (
                f"Optional refresher: your {skill_name} score is already {current_pct}% "
                f"(meets the {target_pct}% target for {role_name})."
            )
        elif is_priority and priority:
            explanations[course_id] = (
                f"Recommended because your {skill_name} score is {current_pct}% "
                f"(target {target_pct}%) and {priority} is a current company priority."
            )
        else:
            gap = max(0, target_pct - current_pct)
            explanations[course_id] = (
                f"Recommended because your {skill_name} score is {current_pct}% "
                f"(target {target_pct}%), closing a {gap}% gap required for {role_name}."
            )

    return {
        "source": "fallback",
        "explanations": explanations,
        "generatedAt": utc_now_iso(),
    }


def try_gemini_explanations(
    payload: dict[str, Any], api_key: str
) -> dict[str, Any] | None:
    """Call Gemini REST API using env-provided key; return None on any failure."""
    courses = payload.get("courses") or []
    if not courses:
        return None

    role_name = str(payload.get("roleName") or "Target Role")
    priority = str(payload.get("companyPriority") or "General upskilling")
    compact_courses = [
        {
            "courseId": c.get("courseId"),
            "title": c.get("title"),
            "skillName": c.get("skillName"),
            "currentPct": c.get("currentPct"),
            "targetPct": c.get("targetPct"),
            "isPriorityMatch": c.get("isPriorityMatch"),
        }
        for c in courses[:15]
        if isinstance(c, dict) and c.get("courseId")
    ]

    prompt = (
        "You are SkillSync AI, a corporate upskilling advisor. "
        f"Target role: {role_name}. Company priority: {priority}. "
        "For each course below, write ONE concise, clear sentence explaining why it is recommended, "
        "explicitly mentioning the learner's current % vs target % and company priority if relevant. "
        "Return ONLY valid JSON mapping courseId -> explanation string.\n"
        f"Courses: {json.dumps(compact_courses)}"
    )

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={api_key}"
    )

    try:
        resp = requests.post(
            endpoint,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            },
            timeout=5,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            return None
        clean = {str(k): str(v) for k, v in parsed.items() if isinstance(v, str)}
        if not clean:
            return None
        return {
            "source": "ai",
            "explanations": clean,
            "generatedAt": utc_now_iso(),
        }
    except Exception:
        return None


def create_app() -> Flask:
    """Create and configure the Flask application (stateless, localStorage-backed UI)."""
    app = Flask(__name__, static_folder=None)

    @app.get("/api/health")
    def health() -> Any:
        return jsonify({"status": "ok", "timestamp": utc_now_iso()})

    @app.post("/api/ai-explain")
    def ai_explain() -> Any:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Invalid JSON payload"}), 400

        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if api_key:
            ai_result = try_gemini_explanations(payload, api_key)
            if ai_result is not None:
                return jsonify(ai_result)

        return jsonify(build_fallback_explanations(payload))

    @app.get("/")
    @app.get("/index.html")
    @app.get("/profile")
    @app.get("/analyzer")
    @app.get("/analyzer.html")
    @app.get("/courses")
    @app.get("/courses.html")
    def serve_page() -> Any:
        filename = PAGE_FILES.get(request.path)
        if not filename:
            abort(404)
        return send_from_directory(BASE_DIR, filename)

    @app.get("/css/<path:filename>")
    def serve_css(filename: str) -> Any:
        return send_from_directory(BASE_DIR / "css", filename)

    @app.get("/js/<path:filename>")
    def serve_js(filename: str) -> Any:
        return send_from_directory(BASE_DIR / "js", filename)

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5050"))
    app.run(host="127.0.0.1", port=port, debug=False)
