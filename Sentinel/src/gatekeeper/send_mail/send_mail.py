import os
from dotenv import load_dotenv
from mailjet_rest import Client
import logging
from mailjet_rest import Client
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MailjetTransientError(Exception):
    pass


load_dotenv()
MAILJET_API_KEY: str = os.getenv("MAILJET_API_KEY", "")
MAILJET_SECRET_KEY: str = os.getenv(
    "MAILJET_SECRET_KEY", ""
)
SENDER_EMAIL: str = "requests@crownpointconsult.com"
SENDER_NAME: str = "Crown Point Gatekeeper"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(MailjetTransientError),
    reraise=True,
)
def send_audit_confirmation(
    recipient_email: str, facility_name: str, email_content: str
):
    mailjet = Client(auth=(MAILJET_API_KEY, MAILJET_SECRET_KEY), version="v3.1")

    data = {
        "Messages": [
            {
                "From": {"Email": SENDER_EMAIL, "Name": SENDER_NAME},
                "To": [{"Email": recipient_email}],
                "Subject": f"New Audit Request from {facility_name}",
                "HTMLPart": email_content,
            }
        ]
    }

    try:
        result = mailjet.send.create(data=data)
        print(f"Result: {result} {MAILJET_SECRET_KEY} {MAILJET_API_KEY} {SENDER_EMAIL}")
        if result.status_code == 200:
            print(f"Successfully sent email to {recipient_email}")
        else:
            print(f"Failed to send email to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email to {recipient_email}")
        raise e


def send_audit_confirmation(
    recipient_email: str, facility_name: str, email_content: str
):
    mailjet = Client(auth=(MAILJET_API_KEY, MAILJET_SECRET_KEY), version="v3.1")

    data = {
        "Messages": [
            {
                "From": {"Email": SENDER_EMAIL, "Name": SENDER_NAME},
                "To": [{"Email": recipient_email}],
                "Subject": f"New Audit Request from {facility_name}",
                "HTMLPart": email_content,
            }
        ]
    }

    try:
        result = mailjet.send.create(data=data)
        status_code = result.status_code
        response_json = result.json()

        # 1. Handle Success
        if status_code == 200:
            # Check individual message status (Mailjet v3.1 returns 'Status' per message)
            msg_status = response_json["Messages"][0]["Status"]
            if msg_status == "success":
                logger.info(f"Successfully sent email to {recipient_email}")
                return response_json
            else:
                logger.error(
                    f"Mailjet accepted request but message failed: {msg_status}"
                )
                return response_json

        # 2. Handle Rate Limiting or Server Errors (Retry these)
        elif status_code == 429 or status_code >= 500:
            logger.warning(f"Transient error {status_code}. Retrying...")
            raise MailjetTransientError(f"Status {status_code}: {result.text}")

        # 3. Handle Client Errors (Do NOT retry these)
        else:
            logger.error(f"Permanent failure {status_code}: {result.text}")
            return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise e
