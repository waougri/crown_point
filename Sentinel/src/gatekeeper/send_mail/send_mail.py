import smtplib
import ssl
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from dotenv import dotenv_values, load_dotenv

load_dotenv()
config = dotenv_values("../../../.env")
# CONFIGURATION (Best stored in a .env file)
SMTP_SERVER: str = "smtp.zoho.com"
SMTP_PORT: int = 587
SENDER_EMAIL: str = "requests@crownpointconsult.com"
SENDER_PASSWORD: str = os.getenv("ZOHO_APP_PW")


def send_audit_confirmation(recipient_email: str, facility_name: str, email_content: str):
    """
    Sends a beautifully formatted HTML send_mail via Zoho Mail using secure TLS.
    """

    # 1. Create the Email Structure
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Audit Received: {facility_name}"
    msg["From"] = formataddr(("Crown Point Systems", SENDER_EMAIL))
    msg["To"] = recipient_email

    # Attach HTML version
    msg.attach(MIMEText(email_content, "html"))

    # 3. Secure Sending Logic
    context = ssl.create_default_context()

    try:
        # 'with' ensures the connection is automatically closed even if errors occur
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)  # Upgrade connection to secure TLS
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
            print(f"✅ Email successfully sent to {recipient_email}")

    except Exception as e:
        print(f"❌ Failed to send send_mail: {e}")
