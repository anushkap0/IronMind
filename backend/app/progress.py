"""
Shared helpers for streak tracking and badge computation. Kept separate from
the routers so any endpoint (bmi, routines, workouts) can log activity
without circular imports.
"""
import datetime as dt

from sqlalchemy.orm import Session

from app import models


def log_activity(db: Session, user_id: int, kind: str):
    """Record that the user did something today. Safe to call multiple
    times per day — only one row per (user, day, kind) is kept."""
    today = dt.date.today()
    existing = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.user_id == user_id,
            models.ActivityLog.activity_date == today,
            models.ActivityLog.kind == kind,
        )
        .first()
    )
    if existing:
        return
    db.add(models.ActivityLog(user_id=user_id, activity_date=today, kind=kind))
    db.commit()


def compute_streak(db: Session, user_id: int) -> int:
    """Consecutive days (ending today or yesterday) with at least one
    activity log entry, regardless of kind."""
    dates = (
        db.query(models.ActivityLog.activity_date)
        .filter(models.ActivityLog.user_id == user_id)
        .distinct()
        .all()
    )
    date_set = {d[0] for d in dates}
    if not date_set:
        return 0

    today = dt.date.today()
    # Streak can still count as "active" if today has no entry yet but
    # yesterday does — don't punish someone for not having logged in yet today.
    cursor = today if today in date_set else today - dt.timedelta(days=1)
    if cursor not in date_set:
        return 0

    streak = 0
    while cursor in date_set:
        streak += 1
        cursor -= dt.timedelta(days=1)
    return streak


BADGES = [
    {
        "id": "first-steps",
        "name": "First Steps",
        "description": "Log your first BMI reading.",
        "check": lambda stats: stats["bmi_count"] >= 1,
    },
    {
        "id": "week-warrior",
        "name": "Week Warrior",
        "description": "Reach a 7-day activity streak.",
        "check": lambda stats: stats["streak"] >= 7,
    },
    {
        "id": "committed",
        "name": "Committed",
        "description": "Reach a 30-day activity streak.",
        "check": lambda stats: stats["streak"] >= 30,
    },
    {
        "id": "data-driven",
        "name": "Data Driven",
        "description": "Log 10 BMI readings.",
        "check": lambda stats: stats["bmi_count"] >= 10,
    },
    {
        "id": "planner",
        "name": "The Planner",
        "description": "Generate 5 workout/diet routines.",
        "check": lambda stats: stats["routine_count"] >= 5,
    },
    {
        "id": "coach-chat",
        "name": "Curious Mind",
        "description": "Ask the AI Coach 5 questions.",
        "check": lambda stats: stats["chat_count"] >= 5,
    },
]


def compute_badges(stats: dict):
    return [
        {
            "id": b["id"],
            "name": b["name"],
            "description": b["description"],
            "earned": bool(b["check"](stats)),
        }
        for b in BADGES
    ]
