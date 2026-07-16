import datetime as dt

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    auth_provider = Column(String(20), default="local")
    goal = Column(String(50), default="maintain")
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    bmi_records = relationship("BMIRecord", back_populates="owner", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="owner", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="owner", cascade="all, delete-orphan")


class BMIRecord(Base):
    __tablename__ = "bmi_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    bmi = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    owner = relationship("User", back_populates="bmi_records")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String(20))
    content = Column(Text)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    owner = relationship("User", back_populates="chat_messages")


class ActivityLog(Base):
    """One row per (user, calendar day) they did something meaningful in the
    app (BMI check, routine generated, workout completed). Used to compute
    streaks and badges without double-counting multiple actions on the same day."""

    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_date = Column(Date, nullable=False)
    kind = Column(String(30), nullable=False)  # bmi | routine | workout
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    owner = relationship("User", back_populates="activity_logs")
