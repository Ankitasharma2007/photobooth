from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.upload_service import save_photo
from app.services.session_service import load_session

router = APIRouter()


@router.post("/session/{session_id}/upload")
async def upload_photo(
    session_id: str,
    photo: UploadFile = File(...)
):

    session = load_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    result = save_photo(session_id, photo)

    return result