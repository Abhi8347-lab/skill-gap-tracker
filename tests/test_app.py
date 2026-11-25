"""Tests for Flask routes, HTML/static asset serving, and SQLite persistence."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import create_app


@pytest.fixture()
def client(tmp_path: Path):
    db_file = tmp_path / "test_tracker.db"
    app = create_app(db_path=db_file)
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client


def test_health_endpoint(client) -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ok"


def test_pages_and_assets_served(client) -> None:
    for path in [
        "/",
        "/index.html",
        "/analyzer",
        "/analyzer.html",
        "/courses",
        "/courses.html",
        "/css/styles.css",
        "/js/data.js",
        "/js/storage.js",
        "/js/engine.js",
        "/js/nav.js",
        "/js/chart.js",
        "/js/page-profile.js",
        "/js/page-analyzer.js",
        "/js/page-courses.js",
    ]:
        resp = client.get(path)
        assert resp.status_code == 200, f"Expected 200 for {path}, got {resp.status_code}"


def test_profile_and_course_progress_persistence(client) -> None:
    initial = client.get("/api/state").get_json()
    assert initial["profile"] is None
    assert initial["courseProgress"] == {}

    sample_profile = {
        "name": "Priya Nair",
        "status": "student",
        "backgroundDetail": "Computer Science & Engineering (CSE)",
        "targetRole": "ai_ml_engineer",
        "selectedSkills": ["python", "git"],
        "skillRatings": {"python": 3, "git": 4},
        "experience": "0-1",
        "weeklyHours": "5-10",
    }

    save_resp = client.post(
        "/api/profile",
        data=json.dumps(sample_profile),
        content_type="application/json",
    )
    assert save_resp.status_code == 200
    saved = save_resp.get_json()
    assert saved["profile"]["name"] == "Priya Nair"

    # Advance a course to in_progress, then completed
    resp1 = client.post(
        "/api/course-status",
        json={"courseId": "cs50-python", "status": "in_progress"},
    )
    assert resp1.status_code == 200
    assert resp1.get_json()["courseProgress"]["cs50-python"] == "in_progress"

    resp2 = client.post(
        "/api/course-status",
        json={"courseId": "cs50-python", "status": "completed"},
    )
    assert resp2.status_code == 200
    assert resp2.get_json()["courseProgress"]["cs50-python"] == "completed"

    # Resetting course back to not_started removes key cleanly
    resp3 = client.post(
        "/api/course-status",
        json={"courseId": "cs50-python", "status": "not_started"},
    )
    assert resp3.status_code == 200
    assert "cs50-python" not in resp3.get_json()["courseProgress"]


def test_invalid_inputs_rejected(client) -> None:
    bad_status = client.post(
        "/api/course-status",
        json={"courseId": "cs50-python", "status": "invalid_state"},
    )
    assert bad_status.status_code == 400

    bad_course = client.post(
        "/api/course-status",
        json={"courseId": "", "status": "completed"},
    )
    assert bad_course.status_code == 400


def test_state_sync_and_reset(client) -> None:
    sync_resp = client.post(
        "/api/state",
        json={
            "profile": {"name": "Sam", "targetRole": "devops_engineer"},
            "courseProgress": {
                "yt-docker-nana": "completed",
                "ignored-bad": "bogus",
                "ignored-not-started": "not_started",
            },
        },
    )
    assert sync_resp.status_code == 200
    data = sync_resp.get_json()
    assert data["profile"]["name"] == "Sam"
    assert data["courseProgress"] == {"yt-docker-nana": "completed"}

    reset_resp = client.delete("/api/state")
    assert reset_resp.status_code == 200
    cleared = reset_resp.get_json()
    assert cleared["profile"] is None
    assert cleared["courseProgress"] == {}
