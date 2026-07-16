from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.deps import get_current_user
from app.progress import compute_streak
from app.email_service import send_email, build_reminder_email

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


@router.post("/test")
def send_test_reminder(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Sends a reminder email to the logged-in user right now, so you can
    verify your Gmail setup without waiting for the daily scheduled time."""
    streak = compute_streak(db, current_user.id)
    subject, html_body = build_reminder_email(current_user.full_name, streak)
    success, message = send_email(current_user.email, subject, html_body)
    return {"success": success, "message": message, "sent_to": current_user.email}
