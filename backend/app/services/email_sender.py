import os
import socket
from pathlib import Path

import resend

from app.database.db import get_connection
from dotenv import load_dotenv
load_dotenv()


import os
import socket
from pathlib import Path

import resend
from dotenv import load_dotenv

from app.database.db import get_connection


# Load variables from .env
load_dotenv()


def internet_available():
    """
    Check whether the computer can reach Resend.

    Returns:
        True  -> internet/API connection available
        False -> offline
    """

    try:
        socket.create_connection(
            ("api.resend.com", 443),
            timeout=3
        )

        return True

    except OSError:
        return False


def send_pending_emails():
    """
    Send all PENDING emails from the local SQLite queue.

    If internet is unavailable:
        - Do not send anything
        - Do not mark emails as FAILED
        - Leave them as PENDING
    """

    print("Starting email sender...")



    if not internet_available():

        print("Internet unavailable.")
        print("Keeping emails PENDING.")

        return


    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:

        # Same contract as being offline: keep everything PENDING so the queue
        # drains once a key is configured, instead of failing every 30 seconds.
        print("RESEND_API_KEY not set in .env.")
        print("Keeping emails PENDING.")

        return

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
        session_id = row["session_id"]
        recipient = row["email"]
        image_path = Path(row["image_path"])

        print()
        print(
            f"Sending queue #{queue_id} to {recipient}"
        )


        if not image_path.exists():

            error_message = (
                f"Image not found: {image_path}"
            )

            cursor.execute(
                """
                UPDATE email_queue
                SET
                    status = 'FAILED',
                    error_message = ?
                WHERE id = ?
                """,
                (
                    error_message,
                    queue_id
                )
            )

            connection.commit()

            print("FAILED: image not found.")

            continue

        try:

            with open(image_path, "rb") as file:

                image_data = file.read()


           
            attachment = {
                "content": list(image_data),
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

                        <p>
                            Enjoy your photo!
                        </p>
                    """,

                    "attachments": [
                        attachment
                    ],
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

            error_message = str(e)

            cursor.execute(
                """
                UPDATE email_queue
                SET
                    status = 'FAILED',
                    error_message = ?
                WHERE id = ?
                """,
                (
                    error_message,
                    queue_id
                )
            )

            connection.commit()

            print(
                f"FAILED: {error_message}"
            )



    connection.close()

    print()
    print("Email processing finished.")