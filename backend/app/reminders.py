"""
Daily reminder scheduler. Runs inside the same backend process using
APScheduler's background scheduler — no separate worker/cron container
needed for a project this size.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.database import SessionLocal
from app import models
from app.progress import compute_streak
from app.email_service import send_email, build_reminder_email

logger = logging.getLogger("ironmind.reminders")

_scheduler: BackgroundScheduler | None = None


def send_daily_reminders():
    """Sends the reminder email to every registered user. Called by the
    scheduler on its cron trigger, and also callable directly for testing."""
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        logger.info("Sending daily reminders to %d user(s)...", len(users))
        for user in users:
            streak = compute_streak(db, user.id)
            subject, html_body = build_reminder_email(user.full_name, streak)
            success, message = send_email(user.email, subject, html_body)
            if not success:
                logger.warning("Reminder to %s failed: %s", user.email, message)
    finally:
        db.close()


def start_scheduler():
    global _scheduler
    if not settings.REMINDERS_ENABLED:
        logger.info("REMINDERS_ENABLED is False — daily reminder scheduler not started.")
        return

    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(timezone=settings.REMINDER_TIMEZONE)
    _scheduler.add_job(
        send_daily_reminders,
        trigger=CronTrigger(hour=settings.REMINDER_HOUR, minute=0),
        id="daily_reminders",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(
        "Daily reminder scheduler started: %02d:00 %s.",
        settings.REMINDER_HOUR,
        settings.REMINDER_TIMEZONE,
    )


def stop_scheduler():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
