from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.deps import get_current_user
from app.progress import compute_streak, compute_badges

router = APIRouter(prefix="/api/progress", tags=["Progress"])


@router.get("/summary")
def progress_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bmi_count = (
        db.query(models.BMIRecord).filter(models.BMIRecord.user_id == current_user.id).count()
    )
    chat_count = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == current_user.id, models.ChatMessage.role == "user")
        .count()
    )
    routine_count = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.user_id == current_user.id, models.ActivityLog.kind == "routine")
        .count()
    )

    streak = compute_streak(db, current_user.id)

    stats = {
        "bmi_count": bmi_count,
        "chat_count": chat_count,
        "routine_count": routine_count,
        "streak": streak,
    }

    badges = compute_badges(stats)

    return {
        "streak_days": streak,
        "stats": stats,
        "badges": badges,
    }
