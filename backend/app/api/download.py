from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.services.session_service import UPLOAD_ROOT

router = APIRouter()


@router.get("/session/{session_id}/download")
def download(session_id: str):

    image_path = (
        Path(UPLOAD_ROOT)
        / session_id
        / "output"
        / "final_hd.png"
    )

    if not image_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Generated image not found"
        )

    return FileResponse(
        path=image_path,
        media_type="image/png",
        filename="photobooth.png"
    )