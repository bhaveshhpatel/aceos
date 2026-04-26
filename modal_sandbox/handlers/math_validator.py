"""
Math Validator — AP Calculus, AP Statistics
TS2-01 — Modal.com Python Sandbox

Supports:
  - numerical: float comparison with tolerance
  - symbolic: sympy symbolic equivalence
  - expression: same as symbolic
"""

from sympy import sympify, simplify, N
from sympy.parsing.latex import parse_latex


def validate_math(request: dict) -> dict:
    student_answer = request["student_answer"]
    correct_answer = request["correct_answer"]
    tolerance = request.get("tolerance", 0.01)
    answer_type = request.get("answer_type", "numerical")

    try:
        if answer_type == "numerical":
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

        elif answer_type in ["symbolic", "expression"]:
            student_expr = sympify(student_answer)
            correct_expr = sympify(correct_answer)
            is_correct = simplify(student_expr - correct_expr) == 0

            return {
                "correct": bool(is_correct),
                "student_value": str(student_expr),
                "expected_value": str(correct_expr),
                "tolerance_used": 0,
                "error": None,
            }

        else:
            # Unknown answer_type — attempt numerical fallback
            return validate_math({**request, "answer_type": "numerical"})

    except Exception as e:
        return {
            "correct": False,
            "student_value": student_answer,
            "expected_value": correct_answer,
            "tolerance_used": tolerance,
            "error": str(e),
        }
