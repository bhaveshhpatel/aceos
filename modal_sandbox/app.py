"""
AceOS STEM Validation Sandbox
TS2-01 — Modal.com Python Sandbox Deployment

Deploy with:
  modal deploy modal_sandbox/app.py

The deployed URL will look like:
  https://aceos-stem-validator--validate.modal.run

Set this as MODAL_SANDBOX_URL in your deployment environment.
"""

import modal
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

app = modal.App("aceos-stem-validator")

image = modal.Image.debian_slim().pip_install(
    "sympy==1.13.0",
    "numpy==1.26.4",
    "scipy==1.13.0",
    "chempy==0.8.3",
    "pint==0.23",
    "fastapi==0.111.0",
    "uvicorn==0.30.0",
)

web_app = FastAPI()
security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify the Bearer token matches MODAL_API_KEY env var."""
    expected = os.environ.get("MODAL_API_KEY", "")
    if not expected or credentials.credentials != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@web_app.post("/validate", dependencies=[Depends(verify_token)])
async def validate(request: dict) -> dict:
    """
    Routes to subject-specific validator based on request.subject_type.
    Returns: { correct, student_value, expected_value, tolerance_used, error }
    """
    from handlers.math_validator import validate_math
    from handlers.chem_validator import validate_chemistry
    from handlers.physics_validator import validate_physics

    subject = request.get("subject_type", "")

    try:
        if subject in ["AP Calculus AB", "AP Calculus BC", "AP Statistics"]:
            return validate_math(request)
        elif subject in ["AP Chemistry"]:
            return validate_chemistry(request)
        elif subject in ["AP Physics 1", "AP Physics 2", "AP Physics C"]:
            return validate_physics(request)
        else:
            return validate_math(request)  # fallback for unknown STEM
    except Exception as e:
        return {
            "correct": False,
            "student_value": request.get("student_answer"),
            "expected_value": request.get("correct_answer"),
            "tolerance_used": request.get("tolerance", 0.01),
            "error": str(e),
        }


@app.function(
    image=image,
    timeout=30,
    memory=512,
    cpu=0.25,
    retries=modal.Retries(max_retries=2, backoff_coefficient=1.5),
    secrets=[modal.Secret.from_name("aceos-modal-secrets")],
)
@modal.asgi_app()
def fastapi_app():
    return web_app
