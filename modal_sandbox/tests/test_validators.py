"""
Local unit tests for Modal sandbox handlers.
Run with: pytest modal_sandbox/tests/test_validators.py

These run LOCALLY against the handler functions directly —
not against the deployed Modal endpoint.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from handlers.math_validator import validate_math
from handlers.chem_validator import validate_chemistry
from handlers.physics_validator import validate_physics


# --- Math Validator ---

def test_numerical_correct_within_tolerance():
    result = validate_math({
        "student_answer": "4.20",
        "correct_answer": "4.2",
        "answer_type": "numerical",
        "tolerance": 0.01,
    })
    assert result["correct"] is True
    assert result["error"] is None


def test_numerical_incorrect_outside_tolerance():
    result = validate_math({
        "student_answer": "3.8",
        "correct_answer": "4.2",
        "answer_type": "numerical",
        "tolerance": 0.01,
    })
    assert result["correct"] is False


def test_symbolic_equivalent_expressions():
    result = validate_math({
        "student_answer": "x**2 + 2*x + 1",
        "correct_answer": "(x+1)**2",
        "answer_type": "symbolic",
    })
    assert result["correct"] is True


def test_symbolic_non_equivalent_expressions():
    result = validate_math({
        "student_answer": "x**2 + 2*x + 2",
        "correct_answer": "(x+1)**2",
        "answer_type": "symbolic",
    })
    assert result["correct"] is False


def test_invalid_expression_returns_error():
    result = validate_math({
        "student_answer": "not_a_number!!!",
        "correct_answer": "4.2",
        "answer_type": "numerical",
    })
    assert result["correct"] is False
    assert result["error"] is not None


def test_zero_correct_answer_uses_absolute_tolerance():
    result = validate_math({
        "student_answer": "0.001",
        "correct_answer": "0",
        "answer_type": "numerical",
        "tolerance": 0.01,
    })
    assert result["correct"] is True


# --- Chemistry Validator ---

def test_chemistry_numerical_correct():
    result = validate_chemistry({
        "student_answer": "44.01",
        "correct_answer": "44.01",
        "answer_type": "numerical",
        "tolerance": 0.01,
    })
    assert result["correct"] is True


def test_chemistry_equation_match():
    result = validate_chemistry({
        "student_answer": "2H2 + O2 -> 2H2O",
        "correct_answer": "2H2 + O2 -> 2H2O",
        "answer_type": "chemical_equation",
    })
    assert result["correct"] is True


def test_chemistry_equation_mismatch():
    result = validate_chemistry({
        "student_answer": "H2 + O2 -> H2O",
        "correct_answer": "2H2 + O2 -> 2H2O",
        "answer_type": "chemical_equation",
    })
    assert result["correct"] is False


# --- Physics Validator ---

def test_physics_numerical_correct():
    result = validate_physics({
        "student_answer": "9.81",
        "correct_answer": "9.81",
        "answer_type": "numerical",
        "tolerance": 0.01,
    })
    assert result["correct"] is True


def test_physics_numerical_incorrect():
    result = validate_physics({
        "student_answer": "10.0",
        "correct_answer": "9.81",
        "answer_type": "numerical",
        "tolerance": 0.01,
    })
    assert result["correct"] is False
