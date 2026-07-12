import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USERNAME)


def send_email(
    to: str,
    subject: str,
    body: str,
):
    """
    Sends an HTML email.
    """

    message = MIMEMultipart("alternative")
    message["From"] = SMTP_FROM
    message["To"] = to
    message["Subject"] = subject

    message.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.sendmail(
                SMTP_FROM,
                [to],
                message.as_string(),
            )

    except Exception as e:
        print(f"Failed to send email to {to}: {e}")