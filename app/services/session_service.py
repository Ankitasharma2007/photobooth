import os
import json
import uuid
from datetime import datetime
from pathlib import Path
 

from app.models.session_model import SessionModel

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_ROOT = os.path.join(BASE_DIR, "storage", "uploads")


def create_session():
    session_id = str(uuid.uuid4())

    session_folder = os.path.join(UPLOAD_ROOT, session_id)

    os.makedirs(os.path.join(session_folder, "photos"), exist_ok=True)
    os.makedirs(os.path.join(session_folder, "thumbnails"), exist_ok=True)
    os.makedirs(os.path.join(session_folder, "output"), exist_ok=True)

    session = SessionModel(
        sessionId=session_id,
        createdAt=datetime.now(),
    )

    session_file = os.path.join(session_folder, "session.json")

    with open(session_file, "w") as f:
        json.dump(session.model_dump(mode="json"), f, indent=4)

    return session

def load_session(session_id: str):
    session_file = os.path.join(
        UPLOAD_ROOT,
        session_id,
        "session.json"
    )

    if not os.path.exists(session_file):
        return None

    with open(session_file, "r") as f:
        return json.load(f)


def save_session(session_id: str, session_data: dict):
    session_file = os.path.join(
        UPLOAD_ROOT,
        session_id,
        "session.json"
    )

    with open(session_file, "w") as f:
        json.dump(session_data, f, indent=4)

def get_photo_paths(session_id):
    session = load_session(session_id)

    photo_dir = Path("storage/uploads") / session_id / "photos"

    paths = []

    for photo in session["photos"]:
        paths.append(str(photo_dir / photo["filename"]))

    return paths

def update_layout(session_id: str, layout: str):
    session = load_session(session_id)
    session["layout"] = layout
    save_session(session_id, session)

def update_frame(session_id: str, frame: str):
    session = load_session(session_id)
    session["frame"] = frame
    save_session(session_id, session)

def get_photos(session_id: str):
    session = load_session(session_id)
    if session is None:
        return None
    return session.get("photos", [])