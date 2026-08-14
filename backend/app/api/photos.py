from fastapi import APIRouter, HTTPException

from app.services.session_service import get_photos

router = APIRouter()


@router.get("/session/{session_id}/photos")
def list_photos(session_id: str):

    photos = get_photos(session_id)

    if photos is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return {
        "count": len(photos),
        "photos": photos
    }