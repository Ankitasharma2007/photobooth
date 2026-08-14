import threading
import time
from app.services.email_sender import send_pending_emails
_worker_started = False
def email_worker():
    """
    Background worker.

    Checks the email queue every 30 seconds.
    If internet is unavailable, email_sender leaves
    the emails as PENDING.
    """
    print("Email worker started")
    while True:
        try:
            send_pending_emails()

        except Exception as e:
            print(f"Email worker error: {e}")

        time.sleep(30)

def start_email_worker():
    """
    Start the email worker in a background thread.
    """

    global _worker_started

    if _worker_started:
        return

    _worker_started = True

    thread = threading.Thread(
        target=email_worker,
        daemon=True
    )

    thread.start()