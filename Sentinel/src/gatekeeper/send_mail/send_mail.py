import os
from dotenv import load_dotenv
from mailjet_rest import Client

load_dotenv()
MAILJET_API_KEY: str = os.getenv("MAILJET_API_KEY", "")
MAILJET_SECRET_KEY: str = os.getenv("MAILJET_SECRET_KEY", "")
SENDER_EMAIL: str = "requests@crownpointconsult.com"
SENDER_NAME: str = "Crown Point Gatekeeper"

def send_audit_confirmation(recipient_email: str, facility_name: str, email_content: str):
    mailjet = Client(auth=(MAILJET_API_KEY, MAILJET_SECRET_KEY), version='v3.1' )

    data = {
        'Messages': [
            {
                "From": {
                    "Email": SENDER_EMAIL,
                    "Name": SENDER_NAME
                },
                "To": [
                    {
                        "Email": recipient_email
                    }
                ],
                "Subject": f"New Audit Request from {facility_name}",
                "HTMLPart": email_content
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
