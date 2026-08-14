from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.email_queue_service import queue_email
from app.services.session_service import UPLOAD_ROOT, load_session


router = APIRouter()


class EmailRequest(BaseModel):

    email: EmailStr

    # Accepted but ignored: the file is always resolved from the session so a
    # client cannot ask the booth to email an arbitrary file off the machine.
    image_path: Optional[str] = None


@router.post("/session/{session_id}/email")
def add_email(
    session_id: str,
    request: EmailRequest
):

    if load_session(session_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    image_path = (
        UPLOAD_ROOT
        / session_id
        / "output"
        / "final_hd.png"
    )

    if not image_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Generate the photo before emailing it"
        )

    return queue_email(
        session_id=session_id,
        email=str(request.email),
        image_path=str(image_path)
    )
