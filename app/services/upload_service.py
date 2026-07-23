import os
import uuid
import shutil
from datetime import datetime

from PIL import Image

from app.services.session_service import load_session, save_session

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_ROOT = os.path.join(BASE_DIR, "storage", "uploads")


def save_photo(session_id: str, upload_file):

    image_id = str(uuid.uuid4())

    extension = os.path.splitext(upload_file.filename)[1]
    filename = f"{image_id}{extension}"

    session_folder = os.path.join(UPLOAD_ROOT, session_id)

    photos_folder = os.path.join(session_folder, "photos")
    thumbs_folder = os.path.join(session_folder, "thumbnails")

    # Save original image
    photo_path = os.path.join(photos_folder, filename)

    with open(photo_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    # Create thumbnail
    thumbnail_path = os.path.join(thumbs_folder, filename)

    image = Image.open(photo_path)
    image.thumbnail((300, 300))
    image.save(thumbnail_path)

    # Update session.json
    session = load_session(session_id)

    session["photos"].append({
        "id": image_id,
        "filename": filename,
        "uploadedAt": datetime.now().isoformat()
    })

    save_session(session_id, session)

    # Return response
    return {
        "imageId": image_id,
        "filename": filename
    }