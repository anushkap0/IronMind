from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app import models

router = APIRouter(prefix="/api/workouts", tags=["Workout Timer"])

TIMER_PRESETS = [
    {
        "id": "tabata",
        "name": "Tabata Blast",
        "description": "Classic 20s on / 10s off high-intensity intervals.",
        "rounds": 8,
        "work_seconds": 20,
        "rest_seconds": 10,
        "warmup_seconds": 60,
        "cooldown_seconds": 60,
    },
    {
        "id": "hiit-standard",
        "name": "HIIT Standard",
        "description": "40s work / 20s rest, great for full-body circuits.",
        "rounds": 10,
        "work_seconds": 40,
        "rest_seconds": 20,
        "warmup_seconds": 120,
        "cooldown_seconds": 120,
    },
    {
        "id": "strength-circuit",
        "name": "Strength Circuit",
        "description": "45s work / 15s rest across 6 exercises, 3 rounds.",
        "rounds": 18,
        "work_seconds": 45,
        "rest_seconds": 15,
        "warmup_seconds": 180,
        "cooldown_seconds": 120,
    },
    {
        "id": "endurance",
        "name": "Endurance Builder",
        "description": "Longer 60s work / 30s rest intervals for stamina.",
        "rounds": 6,
        "work_seconds": 60,
        "rest_seconds": 30,
        "warmup_seconds": 120,
        "cooldown_seconds": 120,
    },
]


@router.get("/presets")
def get_presets(current_user: models.User = Depends(get_current_user)):
    return TIMER_PRESETS
