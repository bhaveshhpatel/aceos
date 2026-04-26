/**
 * Modal.com STEM Validation Types
 * TS2-01 — Modal.com Python Sandbox Deployment
 */

export type STEMAnswerType = 'numerical' | 'symbolic' | 'expression' | 'chemical_equation';

export interface STEMValidationRequest {
  question_id: string;
  subject_type: 'AP Calculus AB' | 'AP Calculus BC' | 'AP Statistics' | 'AP Chemistry' | 'AP Physics 1' | 'AP Physics 2' | 'AP Physics C' | string;
  student_answer: string;
  correct_answer: string;
  answer_type: STEMAnswerType;
  tolerance?: number;
  units?: string;
  significant_figures?: number;
}

export interface STEMValidationResponse {
  correct: boolean | null;  // null = validation unavailable (graceful degradation)
  student_value: string | number | null;
  expected_value: string | number | null;
  tolerance_used: number;
  error: string | null;
  execution_time_ms: number;
}
