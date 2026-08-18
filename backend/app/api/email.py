from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.email_queue_service import queue_email


router = APIRouter()


class EmailRequest(BaseModel):

    email: EmailStr
    image_path: str


@router.post("/session/{session_id}/email")
def add_email(
    session_id: str,
    request: EmailRequest
):

    try:

        result = queue_email(
            session_id=session_id,
            email=str(request.email),
            image_path=request.image_path
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )