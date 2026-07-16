from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.rag.rag_engine import generate_reply
from app.rate_limit import limiter

router = APIRouter(prefix="/api/chat", tags=["AI Coach (RAG)"])


def _profile_summary(db: Session, user: models.User) -> str:
    latest = (
        db.query(models.BMIRecord)
        .filter(models.BMIRecord.user_id == user.id)
        .order_by(models.BMIRecord.created_at.desc())
        .first()
    )
    if not latest:
        return f"Goal: {user.goal}. No BMI recorded yet."
    return (
        f"Goal: {user.goal}. Latest BMI: {latest.bmi} ({latest.category}), "
        f"weight {latest.weight_kg}kg, height {latest.height_cm}cm."
    )


@router.post("/ask", response_model=schemas.ChatResponse)
@limiter.limit("15/minute")
def ask_coach(
    request: Request,
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = _profile_summary(db, current_user)
    reply, sources = generate_reply(payload.message, profile)

    db.add(models.ChatMessage(user_id=current_user.id, role="user", content=payload.message))
    db.add(models.ChatMessage(user_id=current_user.id, role="assistant", content=reply))
    db.commit()

    return schemas.ChatResponse(reply=reply, sources=sources)


@router.get("/history", response_model=list[schemas.ChatHistoryItem])
def chat_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == current_user.id)
        .order_by(models.ChatMessage.created_at.asc())
        .limit(100)
        .all()
    )
    return messages
