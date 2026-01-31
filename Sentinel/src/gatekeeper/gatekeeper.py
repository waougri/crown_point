from enum import Enum
from typing import List, Optional

from fastapi import HTTPException, APIRouter, BackgroundTasks
from pydantic import BaseModel, EmailStr

from src.gatekeeper.send_mail.send_mail import SENDER_EMAIL, send_audit_confirmation

gatekeeper_router = APIRouter()


# Allow your frontend to communicate with the backend
class DateInterval(BaseModel):
    start: str
    end: str


class AuditType(str, Enum):
    CSSD = "CSSD"
    ENDOSCOPY = "Endoscopy"
    DENTAL = "Dental"


class AuditData(BaseModel):
    # Modified: Expects a list of start/end objects
    date_intervals: List[DateInterval]

    audit_type: AuditType
    facility_name: str
    facility_address: str
    is_affiliated: bool
    system_name: Optional[str] = ""
    trauma_level: str

    contact_name: str
    contact_title: str
    contact_phone: str
    contact_email: EmailStr
    reporting_to: str

    accrediting_name: str
    last_audit_date: str
    has_findings: bool
    findings: List[str]  # Zod schema enforces max(4) on frontend

    staff_ft_w_fmla: str
    staff_pt: str
    staff_pd: str
    staff_travelers: str

    hours_operation: str
    or_count: str
    clinic_count: str

    proc_endoscopes: bool
    proc_vascular: bool
    proc_arthroscopic: bool
    proc_robotic: bool
    proc_tee: bool

    has_tracking: bool
    tracking_system_name: Optional[str] = ""

    pain_points: str
    additional_info: Optional[str] = ""
    bot_check: Optional[str] = ""  # Honeypot field


def generate_html_email(data: AuditData):
    dates_html = "".join(
        [
            f"<div style='margin-bottom:4px;'>📅 {d.start} to {d.end}</div>"
            for d in data.date_intervals
        ]
    )

    # Format Findings
    findings_list = "".join([f"<li>{f}</li>" for f in data.findings if f.strip()])
    findings_html = f"<ul>{findings_list}</ul>" if findings_list else "None reported"

    # Processing Scope tags
    scope_items = []
    if data.proc_endoscopes:
        scope_items.append("Endoscopes")
    if data.proc_vascular:
        scope_items.append("Vascular/Heart")
    if data.proc_arthroscopic:
        scope_items.append("Arthroscopic")
    if data.proc_robotic:
        scope_items.append("Robotic")
    if data.proc_tee:
        scope_items.append("TEE Probes")
    scope_html = ", ".join(scope_items) if scope_items else "Standard Processing"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #faf5ff; margin: 0; padding: 20px; color: #1e293b; }}
            .container {{ max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f3e8ff; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.05); }}
            .header {{ background: linear-gradient(135deg, #9333ea 0%, #db2777 100%); padding: 30px; text-align: center; color: white; }}
            .section {{ padding: 25px; border-bottom: 1px solid #f3e8ff; }}
            .section-title {{ color: #7e22ce; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }}
            .grid {{ display: table; width: 100%; }}
            .row {{ display: table-row; }}
            .label {{ display: table-cell; padding: 8px 0; font-weight: 600; font-size: 13px; color: #64748b; width: 35%; }}
            .value {{ display: table-cell; padding: 8px 0; font-size: 14px; color: #1e293b; }}
            .pill {{ background: #f3e8ff; color: #7e22ce; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; display: inline-block; }}
            .highlight-box {{ background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 8px; padding: 15px; margin-top: 10px; font-size: 14px; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <p style="margin:0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">New Service Request</p>
                <h1 style="margin: 10px 0 0 0; font-size: 24px;">{data.audit_type.value} Operational Review</h1>
            </div>

            <div class="section">
                <div class="section-title">Facility Information</div>
                <div class="grid">
                    <div class="row"><div class="label">Facility</div><div class="value"><strong>{data.facility_name}</strong></div></div>
                    <div class="row"><div class="label">Address</div><div class="value">{data.facility_address}</div></div>
                    <div class="row"><div class="label">System</div><div class="value">{data.system_name if data.is_affiliated else "Independent"}</div></div>
                    <div class="row"><div class="label">Trauma Level</div><div class="value"><span class="pill">{data.trauma_level}</span></div></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Requested Windows</div>
                <div class="highlight-box" style="color: #9333ea; font-weight: 600;">
                    {dates_html}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Point of Contact</div>
                <div class="grid">
                    <div class="row"><div class="label">Contact</div><div class="value">{data.contact_name} ({data.contact_title})</div></div>
                    <div class="row"><div class="label">Email</div><div class="value"><a href="mailto:{data.contact_email}" style="color: #9333ea;">{data.contact_email}</a></div></div>
                    <div class="row"><div class="label">Phone</div><div class="value">{data.contact_phone}</div></div>
                    <div class="row"><div class="label">Reporting To</div><div class="value">{data.reporting_to}</div></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Operations & Scope</div>
                <div class="grid">
                    <div class="row"><div class="label">Staffing (FT/PT/PD)</div><div class="value">{data.staff_ft_w_fmla} / {data.staff_pt} / {data.staff_pd}</div></div>
                    <div class="row"><div class="label">Main ORs</div><div class="value">{data.or_count}</div></div>
                    <div class="row"><div class="label">Specialized Scope</div><div class="value">{scope_html}</div></div>
                    <div class="row"><div class="label">Tracking System</div><div class="value">{data.tracking_system_name or "None"}</div></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Pain Points & Notes</div>
                <div style="font-size: 14px; line-height: 1.6; color: #334155;">
                    <p><strong>Primary Concerns:</strong><br>{data.pain_points}</p>
                    {f'<p><strong>Additional Info:</strong><br>{data.additional_info}</p>' if data.additional_info else ""}
                </div>
            </div>

            <div class="section" style="border-bottom: none;">
                <div class="section-title">Regulatory History</div>
                <div class="grid">
                    <div class="row"><div class="label">Accreditor</div><div class="value">{data.accrediting_name}</div></div>
                    <div class="row"><div class="label">Last Audit</div><div class="value">{data.last_audit_date}</div></div>
                </div>
                <div class="highlight-box">
                    <strong>Past Findings:</strong><br>
                    {findings_html}
                </div>
            </div>

            <div class="footer">
                This is an automated notification from the Pre-Audit Assessment Portal.
            </div>
        </div>
    </body>
    </html>
    """


@gatekeeper_router.post("/api/gatekeeper", status_code=201)
async def submit_audit(data: AuditData, background_tasks: BackgroundTasks):

    try:
        email_str = generate_html_email(data)
        send_audit_confirmation(SENDER_EMAIL, data.facility_name, email_str)
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)
