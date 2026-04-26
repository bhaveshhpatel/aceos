"""
Physics Validator — AP Physics 1, 2, C
TS2-01 — Modal.com Python Sandbox

Uses pint for unit-aware comparison when units are provided.
Falls back to dimensionless numerical comparison if no units given.
"""

from sympy import sympify


def validate_physics(request: dict) -> dict:
    student_answer = request["student_answer"]
    correct_answer = request["correct_answer"]
    tolerance = request.get("tolerance", 0.01)
    units = request.get("units", None)
    answer_type = request.get("answer_type", "numerical")

    try:
        if units:
            return _validate_with_units(student_answer, correct_answer, tolerance, units)
        else:
            return _validate_numerical(student_answer, correct_answer, tolerance)

    except Exception as e:
        return {
            "correct": False,
            "student_value": student_answer,
            "expected_value": correct_answer,
            "tolerance_used": tolerance,
            "error": str(e),
        }


def _validate_numerical(student_answer, correct_answer, tolerance):
    student_val = float(sympify(student_answer))
    correct_val = float(sympify(correct_answer))

    if correct_val == 0:
        is_correct = abs(student_val) <= tolerance
    else:
        is_correct = abs(student_val - correct_val) / abs(correct_val) <= tolerance

    return {
        "correct": is_correct,
        "student_value": student_val,
        "expected_value": correct_val,
        "tolerance_used": tolerance,
        "error": None,
    }


def _validate_with_units(student_answer, correct_answer, tolerance, units):
    import pint
    ureg = pint.UnitRegistry()

    # Parse student answer — try attaching units if not already included
    try:
        student_qty = ureg.parse_expression(f"{student_answer} {units}")
        correct_qty = ureg.parse_expression(f"{correct_answer} {units}")
    except Exception:
        # Fall back to dimensionless if unit parsing fails
        return _validate_numerical(student_answer, correct_answer, tolerance)

    student_mag = float(student_qty.magnitude)
    correct_mag = float(correct_qty.magnitude)

    if correct_mag == 0:
        is_correct = abs(student_mag) <= tolerance
    else:
        is_correct = abs(student_mag - correct_mag) / abs(correct_mag) <= tolerance

    return {
        "correct": is_correct,
        "student_value": student_mag,
        "expected_value": correct_mag,
        "tolerance_used": tolerance,
        "error": None,
    }
