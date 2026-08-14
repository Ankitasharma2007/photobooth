import uuid
from datetime import datetime
from pathlib import Path
import shutil

from PIL import Image

from app.database.db import get_connection
from app.services.session_service import load_session



BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_ROOT = BASE_DIR / "storage" / "uploads"


def save_photo(session_id: str, upload_file):

    # Check that session exists
    session = load_session(session_id)

    if session is None:
        raise Exception("Session not found")

    # Generate unique image ID
    image_id = str(uuid.uuid4())

    # Get original extension
    original_filename = upload_file.filename or ""

    extension = Path(original_filename).suffix.lower()

    if not extension:
        extension = ".jpg"

    # Create filename
    filename = f"{image_id}{extension}"

    # Session folders
    session_folder = UPLOAD_ROOT / session_id

    photos_folder = session_folder / "photos"
    thumbs_folder = session_folder / "thumbnails"

    # Make sure folders exist
    photos_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    thumbs_folder.mkdir(
        parents=True,
        exist_ok=True
    )

   
    photo_path = photos_folder / filename

    with open(photo_path, "wb") as buffer:
        shutil.copyfileobj(
            upload_file.file,
            buffer
        )

    thumbnail_path = thumbs_folder / filename

    image = Image.open(photo_path)

    image.thumbnail(
        (300, 300),
        Image.Resampling.LANCZOS
    )

    # JPEG does not support RGBA
    if image.mode in ("RGBA", "LA", "P"):
        image = image.convert("RGB")

    image.save(thumbnail_path)

   
    uploaded_at = datetime.now().isoformat()

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO photos (
            id,
            session_id,
            filename,
            uploaded_at
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            image_id,
            session_id,
            filename,
            uploaded_at
        )
    )

    connection.commit()
    connection.close()

    
    return {
        "imageId": image_id,
        "filename": filename,
        "uploadedAt": uploaded_at
    }