"""Pure logic tests for BMI calculation helpers — no DB or HTTP needed."""
from app.routers.bmi import classify_bmi, healthy_weight_range


def test_classify_bmi_underweight():
    assert classify_bmi(17.0) == "Underweight"


def test_classify_bmi_normal():
    assert classify_bmi(22.0) == "Normal weight"


def test_classify_bmi_overweight():
    assert classify_bmi(27.5) == "Overweight"


def test_classify_bmi_obese():
    assert classify_bmi(32.0) == "Obese"


def test_classify_bmi_boundary_values():
    assert classify_bmi(18.5) == "Normal weight"
    assert classify_bmi(24.9) == "Normal weight"
    assert classify_bmi(25.0) == "Overweight"
    assert classify_bmi(30.0) == "Obese"


def test_healthy_weight_range():
    low, high = healthy_weight_range(175)
    assert low == 56.7
    assert high == 76.3
