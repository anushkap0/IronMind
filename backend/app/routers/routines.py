from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.sockets import notify_user
from app.progress import log_activity

router = APIRouter(prefix="/api/routines", tags=["Routines"])

SPLITS = {
    3: ["Full Body A", "Full Body B", "Full Body C"],
    4: ["Upper Body", "Lower Body", "Push", "Pull"],
    5: ["Push", "Pull", "Legs", "Upper Body", "Lower Body"],
    6: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
}

EXERCISE_LIBRARY = {
    "Full Body A": [("Back Squat", 4, "6-8", 120), ("Bench Press", 4, "6-8", 120), ("Barbell Row", 3, "8-10", 90), ("Plank", 3, "45s", 45)],
    "Full Body B": [("Deadlift", 3, "5", 150), ("Overhead Press", 4, "6-8", 120), ("Lat Pulldown", 3, "10-12", 90), ("Hanging Leg Raise", 3, "10-15", 45)],
    "Full Body C": [("Front Squat", 4, "6-8", 120), ("Incline Dumbbell Press", 3, "8-10", 90), ("Seated Cable Row", 3, "10-12", 90), ("Farmer's Carry", 3, "40m", 60)],
    "Upper Body": [("Bench Press", 4, "6-8", 120), ("Barbell Row", 4, "8-10", 90), ("Overhead Press", 3, "8-10", 90), ("Lat Pulldown", 3, "10-12", 60), ("Bicep Curl", 3, "12", 45)],
    "Lower Body": [("Back Squat", 4, "6-8", 150), ("Romanian Deadlift", 3, "8-10", 120), ("Walking Lunges", 3, "12/leg", 60), ("Calf Raise", 3, "15", 45)],
    "Push": [("Bench Press", 4, "6-8", 120), ("Overhead Press", 3, "8-10", 90), ("Incline Dumbbell Press", 3, "10", 90), ("Triceps Pushdown", 3, "12-15", 45)],
    "Pull": [("Deadlift", 3, "5", 150), ("Pull-ups", 4, "6-10", 90), ("Barbell Row", 3, "8-10", 90), ("Face Pull", 3, "15", 45)],
    "Legs": [("Back Squat", 4, "6-8", 150), ("Leg Press", 3, "10-12", 90), ("Leg Curl", 3, "10-12", 60), ("Standing Calf Raise", 4, "15", 45)],
}


def build_workout_plan(days_per_week: int, experience: str):
    days_per_week = days_per_week if days_per_week in SPLITS else 4
    split = SPLITS[days_per_week]
    set_multiplier = {"beginner": 0.8, "intermediate": 1.0, "advanced": 1.15}.get(experience, 1.0)

    plan = []
    for day_name in split:
        exercises = []
        for name, sets, reps, rest in EXERCISE_LIBRARY[day_name]:
            adj_sets = max(2, round(sets * set_multiplier))
            exercises.append({"name": name, "sets": adj_sets, "reps": reps, "rest_seconds": rest})
        plan.append({"day": day_name, "focus": day_name, "exercises": exercises})
    return plan


def build_diet_plan(goal: str, weight_kg: float | None):
    weight_kg = weight_kg or 70
    if goal == "lose":
        cal_per_kg = 26
        protein_ratio, carb_ratio, fat_ratio = 0.35, 0.35, 0.30
    elif goal == "gain":
        cal_per_kg = 36
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.45, 0.25
    else:  # maintain
        cal_per_kg = 31
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.40, 0.30

    daily_calories = round(cal_per_kg * weight_kg)
    protein_g = round((daily_calories * protein_ratio) / 4)
    carbs_g = round((daily_calories * carb_ratio) / 4)
    fats_g = round((daily_calories * fat_ratio) / 9)

    meals = [
        {"name": "Breakfast", "items": ["Oats with whey protein & berries", "2 whole eggs"], "approx_calories": round(daily_calories * 0.25)},
        {"name": "Lunch", "items": ["Grilled chicken/tofu", "Brown rice", "Mixed vegetables"], "approx_calories": round(daily_calories * 0.35)},
        {"name": "Snack", "items": ["Greek yogurt", "Handful of almonds", "Fruit"], "approx_calories": round(daily_calories * 0.15)},
        {"name": "Dinner", "items": ["Salmon/paneer", "Sweet potato or quinoa", "Salad with olive oil"], "approx_calories": round(daily_calories * 0.25)},
    ]

    return {
        "daily_calories": daily_calories,
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fats_g": fats_g,
        "meals": meals,
    }


@router.post("/generate", response_model=schemas.RoutinePlan)
async def generate_routine(
    payload: schemas.RoutineRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    goal = payload.goal or current_user.goal
    latest_bmi = (
        db.query(models.BMIRecord)
        .filter(models.BMIRecord.user_id == current_user.id)
        .order_by(models.BMIRecord.created_at.desc())
        .first()
    )
    weight = latest_bmi.weight_kg if latest_bmi else None

    workout_plan = build_workout_plan(payload.days_per_week, payload.experience)
    diet_plan = build_diet_plan(goal, weight)

    notes = (
        f"Plan tailored for goal '{goal}', experience '{payload.experience}', "
        f"{payload.days_per_week} training days/week. Adjust portion sizes to taste while "
        f"keeping the calorie and macro targets roughly consistent. Drink water throughout the day."
    )

    log_activity(db, current_user.id, "routine")
    await notify_user(current_user.id, "routine", f"Your new {goal}-focused routine is ready.")

    return schemas.RoutinePlan(workout_plan=workout_plan, diet_plan=diet_plan, notes=notes)
