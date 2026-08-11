from datetime import datetime
from app.database.db import get_connection

def queue_email(
        session_id: str,
        email: str,
        image_path: str
):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO email_queue (
            session_id,
            email,
            image_path,
            status,
            provider,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            session_id,
            email,
            image_path,
            "PENDING",
            "resend",
            datetime.now().isoformat()
        )
    )
    queue_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return {
        "queueId": queue_id,
        "sessionId": session_id,
        "email": email,
        "status": "PENDING"
    }