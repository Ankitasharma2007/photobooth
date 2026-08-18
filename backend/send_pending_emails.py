from app.services.email_sender import send_pending_emails


if __name__ == "__main__":

    print("Starting email sender...")

    send_pending_emails()

    print()
    print("Email processing finished.")