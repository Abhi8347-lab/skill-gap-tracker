"""Flask server and SQLite persistence backend for SkillPath AI."""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, abort, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "skill_tracker.db"
VALID_COURSE_STATUSES = {"not_started", "in_progress", "completed"}

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


def create_app(db_path: str | Path | None = None) -> Flask:
    """Create and configure the Flask application with SQLite persistence."""
    app = Flask(__name__, static_folder=None)
    resolved_db = Path(
        db_path or os.environ.get("SKILL_TRACKER_DB", DEFAULT_DB_PATH)
    )
    app.config["DB_PATH"] = str(resolved_db)

    init_db(app.config["DB_PATH"])

    @app.get("/api/health")
    def health() -> Any:
        return jsonify({"status": "ok", "timestamp": utc_now_iso()})

    @app.get("/api/state")
    def get_state() -> Any:
        return jsonify(load_state(app.config["DB_PATH"]))

    @app.post("/api/profile")
    def save_profile() -> Any:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Invalid JSON profile payload"}), 400

        state = load_state(app.config["DB_PATH"])
        state["profile"] = payload
        updated = persist_state(
            app.config["DB_PATH"],
            profile=state["profile"],
            course_progress=state["courseProgress"],
        )
        return jsonify(updated)

    @app.post("/api/course-status")
    def update_course_status() -> Any:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Invalid JSON payload"}), 400

        course_id = payload.get("courseId")
        status = payload.get("status")
        if not isinstance(course_id, str) or not course_id.strip():
            return jsonify({"error": "Missing or invalid courseId"}), 400
        if status not in VALID_COURSE_STATUSES:
            return jsonify({"error": "Invalid course status"}), 400

        state = load_state(app.config["DB_PATH"])
        progress = dict(state["courseProgress"])
        if status == "not_started":
            progress.pop(course_id, None)
        else:
            progress[course_id] = status

        updated = persist_state(
            app.config["DB_PATH"],
            profile=state["profile"],
            course_progress=progress,
        )
        return jsonify(updated)

    @app.post("/api/state")
    def sync_state() -> Any:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Invalid JSON state payload"}), 400

        profile = payload.get("profile")
        if profile is not None and not isinstance(profile, dict):
            return jsonify({"error": "Invalid profile object"}), 400

        raw_progress = payload.get("courseProgress", {})
        if not isinstance(raw_progress, dict):
            return jsonify({"error": "Invalid courseProgress object"}), 400

        clean_progress = {
            str(k): v
            for k, v in raw_progress.items()
            if v in VALID_COURSE_STATUSES and v != "not_started"
        }
        updated = persist_state(
            app.config["DB_PATH"],
            profile=profile,
            course_progress=clean_progress,
        )
        return jsonify(updated)

    @app.delete("/api/state")
    def reset_state() -> Any:
        updated = persist_state(
            app.config["DB_PATH"], profile=None, course_progress={}
        )
        return jsonify(updated)

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


def init_db(db_path: str) -> None:
    """Initialize SQLite schema if it does not yet exist."""
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                profile_json TEXT,
                course_progress_json TEXT NOT NULL DEFAULT '{}',
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def load_state(db_path: str) -> dict[str, Any]:
    """Read the persisted profile and course progress from SQLite."""
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT profile_json, course_progress_json, updated_at FROM user_state WHERE id = 1"
        ).fetchone()

    if row is None:
        return {"profile": None, "courseProgress": {}, "updatedAt": None}

    profile = json.loads(row["profile_json"]) if row["profile_json"] else None
    course_progress = (
        json.loads(row["course_progress_json"])
        if row["course_progress_json"]
        else {}
    )
    return {
        "profile": profile,
        "courseProgress": course_progress,
        "updatedAt": row["updated_at"],
    }


def persist_state(
    db_path: str, profile: dict[str, Any] | None, course_progress: dict[str, str]
) -> dict[str, Any]:
    """Write profile and course progress atomically to SQLite."""
    now = utc_now_iso()
    profile_json = json.dumps(profile) if profile is not None else None
    progress_json = json.dumps(course_progress)

    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO user_state (id, profile_json, course_progress_json, updated_at)
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                profile_json = excluded.profile_json,
                course_progress_json = excluded.course_progress_json,
                updated_at = excluded.updated_at
            """,
            (profile_json, progress_json, now),
        )
        conn.commit()

    return {
        "profile": profile,
        "courseProgress": course_progress,
        "updatedAt": now,
    }


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5050"))
    app.run(host="127.0.0.1", port=port, debug=False)
