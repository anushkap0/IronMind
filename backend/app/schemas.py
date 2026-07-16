import datetime as dt
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    goal: Optional[str] = "maintain"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    goal: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- BMI ----------
class BMIInput(BaseModel):
    weight_kg: float = Field(..., gt=0, le=500)
    height_cm: float = Field(..., gt=0, le=300)
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = None


class BMIResult(BaseModel):
    bmi: float
    category: str
    healthy_range_kg: List[float]
    advice: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Chat / RAG ----------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []


class ChatHistoryItem(BaseModel):
    role: str
    content: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Routines ----------
class RoutineRequest(BaseModel):
    goal: Optional[str] = None  # lose | maintain | gain
    experience: Optional[str] = "beginner"  # beginner | intermediate | advanced
    days_per_week: Optional[int] = Field(4, ge=1, le=7)


class Exercise(BaseModel):
    name: str
    sets: int
    reps: str
    rest_seconds: int


class WorkoutDay(BaseModel):
    day: str
    focus: str
    exercises: List[Exercise]


class Meal(BaseModel):
    name: str
    items: List[str]
    approx_calories: int


class DietPlan(BaseModel):
    daily_calories: int
    protein_g: int
    carbs_g: int
    fats_g: int
    meals: List[Meal]


class RoutinePlan(BaseModel):
    workout_plan: List[WorkoutDay]
    diet_plan: DietPlan
    notes: str
