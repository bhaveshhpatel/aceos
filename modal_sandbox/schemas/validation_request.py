"""
Validation Request/Response Schemas
TS2-01 — Modal.com Python Sandbox

Mirrors types/modal.ts on the TypeScript side.
Keep these in sync if fields are added or changed.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ValidationRequest:
    question_id: str
    subject_type: str
    student_answer: str
    correct_answer: str
    answer_type: str  # numerical | symbolic | expression | chemical_equation
    tolerance: float = 0.01
    units: Optional[str] = None
    significant_figures: Optional[int] = None


@dataclass
class ValidationResponse:
    correct: Optional[bool]      # None = validation unavailable
    student_value: object
    expected_value: object
    tolerance_used: float
    error: Optional[str]
    execution_time_ms: int = 0
