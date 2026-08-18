import sqlite3
from pathlib import Path
#project root
BASE_DIR = Path(__file__).resolve().parents[2]
#storage dir
STORAGE_DIR = BASE_DIR / "storage"
#database file
DATABASE_PATH = STORAGE_DIR /  "photobooth.db"

def get_connection():
    STORAGE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )
    connection = sqlite3.connect(
        DATABASE_PATH
    )
    connection.row_factory = sqlite3.Row
    return connection

def init_database():
    connection = get_connection()
    cursor = connection.cursor()
    # Sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            template_id TEXT,
            created_at TEXT NOT NULL
        )
    """)

    # Photos table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS photos (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            uploaded_at TEXT NOT NULL,

            FOREIGN KEY (session_id)
                REFERENCES sessions(id)
        )
    """)

    # Email queue table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            email TEXT NOT NULL,
            image_path TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            created_at TEXT NOT NULL,
            sent_at TEXT,
            error_message TEXT,

            FOREIGN KEY (session_id)
                REFERENCES sessions(id)
        )
    """)

    connection.commit()

    connection.close()