import os
from pathlib import Path

import resend

from app.database.db import get_connection
from dotenv import load_dotenv
load_dotenv()

def send_pending_emails():
    """
    Send all PENDING emails using Resend.

    Requires internet.
    """

    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise Exception(
            "RESEND_API_KEY environment variable is not set."
        )

    resend.api_key = api_key

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            session_id,
            email,
            image_path
        FROM email_queue
        WHERE status = 'PENDING'
        ORDER BY id ASC
        """
    )

    rows = cursor.fetchall()

    print(f"Found {len(rows)} pending email(s).")

    for row in rows:

        queue_id = row["id"]
        recipient = row["email"]
        image_path = Path(row["image_path"])

        print()
        print(f"Sending queue #{queue_id} to {recipient}")

        # Check image exists
        if not image_path.exists():

            cursor.execute(
                """
                UPDATE email_queue
                SET
                    status = 'FAILED',
                    error_message = ?
                WHERE id = ?
                """,
                (
                    f"Image not found: {image_path}",
                    queue_id
                )
            )

            connection.commit()

            print("FAILED: image not found.")
            continue

        try:

            with open(image_path, "rb") as file:

                attachment = {
                    "content": list(file.read()),
                    "filename": image_path.name,
                }

            response = resend.Emails.send(
                {
                    "from": "Photobooth <onboarding@resend.dev>",
                    "to": [recipient],
                    "subject": "Your Photobooth Photo",
                    "html": """
                        <h2>Your Photobooth Photo 📸</h2>

                        <p>
                            Thank you for visiting our photobooth!
                        </p>

                        <p>
                            Your photo is attached to this email.
                        </p>
                    """,
                    "attachments": [attachment],
                }
            )

            cursor.execute(
                """
                UPDATE email_queue
                SET
                    status = 'SENT',
                    sent_at = datetime('now'),
                    error_message = NULL
                WHERE id = ?
                """,
                (queue_id,)
            )

            connection.commit()

            print("SENT successfully.")

        except Exception as e:

            cursor.execute(
                """
                UPDATE email_queue
                SET
                    status = 'FAILED',
                    error_message = ?
                WHERE id = ?
                """,
                (
                    str(e),
                    queue_id
                )
            )

            connection.commit()

            print(f"FAILED: {e}")

    connection.close()