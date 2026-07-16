from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.sockets import notify_user
from app.progress import log_activity

router = APIRouter(prefix="/api/bmi", tags=["BMI"])


def classify_bmi(bmi: float) -> str:
    if bmi < 18.5:
        return "Underweight"
    if bmi < 25:
        return "Normal weight"
    if bmi < 30:
        return "Overweight"
    return "Obese"


def advice_for(category: str, goal: str) -> str:
    tips = {
        "Underweight": "Focus on a calorie surplus with nutrient-dense foods and progressive strength training to build lean mass.",
        "Normal weight": "Maintain your current habits. Prioritize consistent strength training, protein intake, and quality sleep.",
        "Overweight": "Aim for a modest calorie deficit (~300-500 kcal/day), combine cardio with resistance training, and increase daily steps.",
        "Obese": "Start with low-impact cardio and full-body strength work, aim for a sustainable calorie deficit, and consider consulting a physician before intense training.",
    }
    return tips.get(category, "Stay consistent with a balanced diet and regular exercise.")


def healthy_weight_range(height_cm: float):
    h_m = height_cm / 100
    low = round(18.5 * h_m * h_m, 1)
    high = round(24.9 * h_m * h_m, 1)
    return [low, high]


@router.post("/calculate", response_model=schemas.BMIResult)
async def calculate_bmi(
    payload: schemas.BMIInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    h_m = payload.height_cm / 100
    bmi_value = round(payload.weight_kg / (h_m * h_m), 1)
    category = classify_bmi(bmi_value)

    record = models.BMIRecord(
        user_id=current_user.id,
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        age=payload.age,
        gender=payload.gender,
        bmi=bmi_value,
        category=category,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_activity(db, current_user.id, "bmi")
    await notify_user(current_user.id, "bmi", f"New BMI recorded: {bmi_value} ({category})")

    return schemas.BMIResult(
        bmi=bmi_value,
        category=category,
        healthy_range_kg=healthy_weight_range(payload.height_cm),
        advice=advice_for(category, current_user.goal),
        created_at=record.created_at,
    )


@router.get("/history", response_model=list[schemas.BMIResult])
def bmi_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    records = (
        db.query(models.BMIRecord)
        .filter(models.BMIRecord.user_id == current_user.id)
        .order_by(models.BMIRecord.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        schemas.BMIResult(
            bmi=r.bmi,
            category=r.category,
            healthy_range_kg=healthy_weight_range(r.height_cm),
            advice=advice_for(r.category, current_user.goal),
            created_at=r.created_at,
        )
        for r in records
    ]
