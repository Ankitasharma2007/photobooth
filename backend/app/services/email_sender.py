import mimetypes
import os
import smtplib
import socket
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv

from app.database.db import get_connection

load_dotenv()

TEMPLATE_PATH = (
    Path(__file__).resolve().parents[1]
    / "templates"
    / "email"
    / "photo_delivery.html"
)


def load_email_template():
    return TEMPLATE_PATH.read_text(encoding="utf-8")


def internet_available():
    """
    Check whether the computer can reach the SMTP server.

    Returns:
        True  -> internet/SMTP connection available
        False -> offline
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    try:
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
    except ValueError:
        smtp_port = 587

    try:
        socket.create_connection(
            (smtp_host, smtp_port),
            timeout=3
        )
        return True
    except OSError:
        return False


def send_pending_emails():
    """
    Send all PENDING emails from the local SQLite queue via Gmail SMTP.

    If internet/SMTP is unavailable:
        - Do not send anything
        - Do not mark emails as FAILED
        - Leave them as PENDING
    """
    print("Starting email sender...")

    if not internet_available():
        print("Internet/SMTP host unavailable.")
        print("Keeping emails PENDING.")
        return

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    try:
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
    except ValueError:
        smtp_port = 587

    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", smtp_username)
    email_from_name = os.getenv("EMAIL_FROM_NAME", "Photobooth")

    if not smtp_username or not smtp_password:
        print("SMTP_USERNAME / SMTP_PASSWORD is not set in .env. Keeping emails PENDING.")
        return

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

    if not rows:
        connection.close()
        return

    try:
        html_template = load_email_template()
    except Exception as e:
        print(f"Failed to load email template: {e}")
        connection.close()
        return

    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_username, smtp_password)
    except Exception as e:
        connection.close()
        print(f"Could not connect/login to SMTP server: {e}")
        return

    for row in rows:
        queue_id = row["id"]
        recipient = row["email"]
        image_path = Path(row["image_path"])

        print()
        print(f"Sending queue #{queue_id} to {recipient}")

        if not image_path.exists():
            error_message = f"Image not found: {image_path}"
            cursor.execute(
                """
                UPDATE email_queue
                SET
                    status = 'FAILED',
                    error_message = ?
                WHERE id = ?
                """,
                (error_message, queue_id)
            )
            connection.commit()
            print("FAILED: image not found.")
            continue

        try:
            with open(image_path, "rb") as file:
                image_data = file.read()

            mime_type, _ = mimetypes.guess_type(image_path.name)
            mime_type = mime_type or "application/octet-stream"
            maintype, subtype = mime_type.split("/", 1)

            message = EmailMessage()
            message["Subject"] = "Your Photobooth Photo"
            message["From"] = f"{email_from_name} <{email_from}>" if email_from_name else email_from
            message["To"] = recipient

            message.set_content(
                "Thank you for visiting our photobooth! "
                "Your photo is attached to this email. Enjoy!"
            )
            message.add_alternative(html_template, subtype="html")

            message.add_attachment(
                image_data,
                maintype=maintype,
                subtype=subtype,
                filename=image_path.name,
            )

            server.send_message(message)

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
                (error_message, queue_id)
            )
            connection.commit()
            print(f"FAILED: {error_message}")

    try:
        server.quit()
    except Exception:
        pass

    connection.close()
    print()
    print("Email processing finished.")