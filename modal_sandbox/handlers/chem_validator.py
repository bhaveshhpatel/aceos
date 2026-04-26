"""
Chemistry Validator — AP Chemistry
TS2-01 — Modal.com Python Sandbox

Supports:
  - numerical: stoichiometry, concentration, molar mass answers
  - chemical_equation: checks if student balanced equation matches (stub — expand in v2)
"""

from sympy import sympify


def validate_chemistry(request: dict) -> dict:
    student_answer = request["student_answer"]
    correct_answer = request["correct_answer"]
    tolerance = request.get("tolerance", 0.01)
    answer_type = request.get("answer_type", "numerical")
    units = request.get("units", None)

    try:
        if answer_type == "chemical_equation":
            # Normalize whitespace and case for equation comparison
            student_norm = _normalize_equation(student_answer)
            correct_norm = _normalize_equation(correct_answer)
            is_correct = student_norm == correct_norm

            return {
                "correct": is_correct,
                "student_value": student_norm,
                "expected_value": correct_norm,
                "tolerance_used": 0,
                "error": None,
            }

        else:
            # Numerical — stoichiometry, concentration, molar mass
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

    except Exception as e:
        return {
            "correct": False,
            "student_value": student_answer,
            "expected_value": correct_answer,
            "tolerance_used": tolerance,
            "error": str(e),
        }


def _normalize_equation(eq: str) -> str:
    """Normalize a chemical equation string for comparison."""
    return eq.strip().lower().replace(" ", "")
