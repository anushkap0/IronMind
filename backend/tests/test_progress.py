"""Tests for the streak/badge computation logic."""
import datetime as dt

from app.progress import compute_streak, compute_badges
from app import models


def _register_and_login(client, email="progress@example.com"):
    client.post(
        "/api/auth/register",
        json={"full_name": "Progress Test", "email": email, "password": "password123", "goal": "lose"},
    )
    login = client.post("/api/auth/login", data={"username": email, "password": "password123"})
    return login.json()["access_token"]


def test_progress_summary_starts_at_zero(client):
    token = _register_and_login(client)
    response = client.get("/api/progress/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["streak_days"] == 0
    assert all(not b["earned"] for b in data["badges"])


def test_bmi_calculation_unlocks_first_steps_badge(client):
    token = _register_and_login(client, email="badge@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/bmi/calculate",
        json={"weight_kg": 75, "height_cm": 175, "age": 25, "gender": "male"},
        headers=headers,
    )

    response = client.get("/api/progress/summary", headers=headers)
    data = response.json()
    assert data["streak_days"] == 1
    first_steps = next(b for b in data["badges"] if b["id"] == "first-steps")
    assert first_steps["earned"] is True


def test_compute_badges_all_locked_with_zero_stats():
    stats = {"bmi_count": 0, "chat_count": 0, "routine_count": 0, "streak": 0}
    badges = compute_badges(stats)
    assert all(not b["earned"] for b in badges)


def test_compute_badges_unlocks_with_enough_stats():
    stats = {"bmi_count": 10, "chat_count": 5, "routine_count": 5, "streak": 30}
    badges = compute_badges(stats)
    assert all(b["earned"] for b in badges)
