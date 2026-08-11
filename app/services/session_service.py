import os

import uuid
from datetime import datetime
from pathlib import Path
 
from app.database.db import get_connection
from app.models.session_model import SessionModel

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_ROOT = BASE_DIR / "storage" / "uploads"
def create_session():
    session_id = str(uuid.uuid4())

    session_folder = UPLOAD_ROOT / session_id
    (session_folder / "photos").mkdir(
        parents=True,
        exist_ok=True
    )

    (session_folder / "thumbnails").mkdir(
        parents=True,
        exist_ok=True
    )

    (session_folder / "output").mkdir(
        parents=True,
        exist_ok=True
    )

    created_at = datetime.now().isoformat()

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO sessions (
            id,
            status,
            template_id,
            created_at
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            session_id,
            "active",
            None,
            created_at
        )
    )

    connection.commit()
    connection.close()

    # Return object compatible with your existing API
    return SessionModel(
        sessionId=session_id,
        createdAt=datetime.fromisoformat(created_at)
    )

def load_session(session_id: str):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT
            id,
            status,
            template_id,
            created_at
        FROM sessions
        WHERE id = ?
        """,
        (session_id,)
    )
    session_row = cursor.fetchone()
    if session_row is None:
        connection.close()
        return None

    cursor.execute(
        """
        SELECT
            id,
            filename,
            uploaded_at
        FROM photos
        WHERE session_id = ?
        ORDER BY uploaded_at
        """,
        (session_id,)
    )
    photo_rows = cursor.fetchall()
    connection.close()
    photos = []
    for photo in photo_rows:
        photos.append({
            "id": photo["id"],
            "filename": photo["filename"],
            "uploadedAt": photo["uploaded_at"] 
        })

    return {
        "sessionId": session_row["id"],
        "status": session_row["status"],
        "templateId": session_row["template_id"],
        "createdAt": session_row["created_at"],
        "photos": photos
    }

def save_session(session_id: str, session_data: dict):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
         """
        UPDATE sessions
        SET
            status = ?,
            template_id = ?
        WHERE id = ?
        """,
        (
            session_data.get("status", "active"),
            session_data.get("templateId"),
            session_id
        )
    )

    connection.commit()
    connection.close()

def get_photo_paths(session_id: str):

    session = load_session(session_id)

    if session is None:
        raise Exception("Session not found")

    photo_dir = UPLOAD_ROOT / session_id / "photos"

    paths = []

    for photo in session["photos"]:

        photo_path = photo_dir / photo["filename"]

        if not photo_path.exists():
            raise Exception(
                f"Photo not found: {photo_path}"
            )

        paths.append(str(photo_path))

    return paths

def update_layout(session_id: str, template_id: str):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE sessions
        SET template_id = ?
        WHERE id = ?
        """,
        (
            template_id,
            session_id
        )
    )

    connection.commit()
    connection.close()

def get_photos(session_id: str):

    session = load_session(session_id)

    if session is None:
        raise Exception("Session not found")

    return session["photos"]
