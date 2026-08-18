from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.generate_service import generate_final

router = APIRouter()


class GenerateRequest(BaseModel):
    template_id: str


@router.post("/session/{session_id}/generate")
def generate(session_id: str, request: GenerateRequest):

    try:

        result = generate_final(
            session_id=session_id,
            template_id=request.template_id
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )