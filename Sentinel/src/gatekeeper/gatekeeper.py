from typing import List, Optional

from fastapi import HTTPException, APIRouter, BackgroundTasks
from pydantic import BaseModel, EmailStr

from src.gatekeeper.send_mail.send_mail import SENDER_EMAIL, send_audit_confirmation

gatekeeper_router = APIRouter()
# Allow your frontend to communicate with the backend
class AuditData(BaseModel):
    date: str
    facility_name: str
    facility_address: str
    is_affiliated: bool
    system_name: Optional[str] = ""
    trauma_level: str
    contact_name: str
    contact_title: str
    contact_phone: str
    contact_email: EmailStr
    accrediting_name: str
    last_audit_date: str
    has_findings: bool
    findings: List[str]
    reporting_to: str
    staff_ft_w_fmla: str
    staff_ft_no_fmla: str
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


def generate_html_email(data: AuditData):
    findings_html = ""
    if data.has_findings and data.findings:
        findings_items = "".join([
            f"<li style='margin-bottom: 8px; color: #334155;'>{f}</li>"
            for f in data.findings if f.strip()
        ])
        findings_html = f"<ul style='margin: 12px 0; padding-left: 24px;'>{findings_items}</ul>"
    else:
        findings_html = "<p style='color: #10b981; margin: 12px 0; font-weight: 500;'>✓ No findings reported</p>"

    def badge(val: bool):
        if val:
            return '<span style="display: inline-block; background: #10b981; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">YES</span>'
        return '<span style="display: inline-block; background: #e2e8f0; color: #64748b; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">NO</span>'

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        
        <div style="max-width: 680px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -24px rgba(15, 23, 42, 0.4);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #ec4899 100%); padding: 32px 40px; color: white;">
                <div style="margin-bottom: 24px;">
                    <img src="https://crownpointconsult.com/assets/bg_less_logo.png" alt="Crown Point Consulting" style="width: 180px; height: auto; display: block;">
                </div>
                <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: rgba(255,255,255,0.95); margin-bottom: 12px;">SPD OPERATIONS REVIEW</div>
                <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; line-height: 1.2;">{data.facility_name}</h1>
                <p style="margin: 0; font-size: 15px; color: rgba(255,255,255,0.9);">{data.facility_address}</p>
            </div>

            <div style="padding: 40px;">
                
                <!-- Facility Overview -->
                <section style="margin-bottom: 36px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Facility Overview</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 14px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; width: 50%;">
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Affiliation Status</div>
                                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">
                                    {data.system_name if data.is_affiliated else "Independent Facility"}
                                </div>
                            </td>
                            <td style="padding: 14px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Trauma Level</div>
                                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{data.trauma_level}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 14px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Hours of Operation</div>
                                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{data.hours_operation}</div>
                            </td>
                            <td style="padding: 14px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">SPD Reports To</div>
                                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{data.reporting_to}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 14px 16px; background: #f8fafc;">
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Operating Rooms</div>
                                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{data.or_count}</div>
                            </td>
                            <td style="padding: 14px 16px; background: #f8fafc;">
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Clinic Locations</div>
                                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{data.clinic_count}</div>
                            </td>
                        </tr>
                    </table>
                </section>

                <!-- Contact Information -->
                <section style="margin-bottom: 36px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Primary Contact</h2>
                    
                    <div style="background: #faf5ff; border-left: 3px solid #a855f7; padding: 18px 20px; border-radius: 6px;">
                        <div style="font-size: 16px; font-weight: 600; color: #7e22ce; margin-bottom: 6px;">{data.contact_name}</div>
                        <div style="font-size: 14px; color: #9333ea; margin-bottom: 8px;">{data.contact_title}</div>
                        <div style="font-size: 13px; color: #a855f7;">
                            <span style="margin-right: 16px;">📞 {data.contact_phone}</span>
                            <span>✉️ {data.contact_email}</span>
                        </div>
                    </div>
                </section>

                <!-- Staffing -->
                <section style="margin-bottom: 36px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Staffing Overview</h2>
                    
                    <div style="display: table; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 16px; background: #faf5ff; text-align: center; border-right: 1px solid #e2e8f0; width: 20%;">
                                <div style="font-size: 24px; font-weight: 700; color: #9333ea; margin-bottom: 4px;">{data.staff_ft_w_fmla}</div>
                                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">FT (FMLA)</div>
                            </div>
                            <div style="display: table-cell; padding: 16px; background: #faf5ff; text-align: center; border-right: 1px solid #e2e8f0; width: 20%;">
                                <div style="font-size: 24px; font-weight: 700; color: #9333ea; margin-bottom: 4px;">{data.staff_ft_no_fmla}</div>
                                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">FT (Active)</div>
                            </div>
                            <div style="display: table-cell; padding: 16px; background: #faf5ff; text-align: center; border-right: 1px solid #e2e8f0; width: 20%;">
                                <div style="font-size: 24px; font-weight: 700; color: #9333ea; margin-bottom: 4px;">{data.staff_pt}</div>
                                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Part Time</div>
                            </div>
                            <div style="display: table-cell; padding: 16px; background: #faf5ff; text-align: center; border-right: 1px solid #e2e8f0; width: 20%;">
                                <div style="font-size: 24px; font-weight: 700; color: #9333ea; margin-bottom: 4px;">{data.staff_pd}</div>
                                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Per Diem</div>
                            </div>
                            <div style="display: table-cell; padding: 16px; background: #faf5ff; text-align: center; width: 20%;">
                                <div style="font-size: 24px; font-weight: 700; color: #9333ea; margin-bottom: 4px;">{data.staff_travelers}</div>
                                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Travelers</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Clinical Capabilities -->
                <section style="margin-bottom: 36px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Clinical Capabilities</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                                <span style="font-size: 14px; color: #334155; margin-right: 12px;">Endoscopes</span>
                                {badge(data.proc_endoscopes)}
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                                <span style="font-size: 14px; color: #334155; margin-right: 12px;">Vascular</span>
                                {badge(data.proc_vascular)}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                                <span style="font-size: 14px; color: #334155; margin-right: 12px;">Arthroscopic</span>
                                {badge(data.proc_arthroscopic)}
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                                <span style="font-size: 14px; color: #334155; margin-right: 12px;">Robotic Surgery</span>
                                {badge(data.proc_robotic)}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0;">
                                <span style="font-size: 14px; color: #334155; margin-right: 12px;">TEE</span>
                                {badge(data.proc_tee)}
                            </td>
                            <td style="padding: 12px 0;">
                                <span style="font-size: 14px; color: #334155; margin-right: 12px;">Instrument Tracking</span>
                                {badge(data.has_tracking)}
                                {f'<span style="font-size: 13px; color: #64748b; margin-left: 8px;">({data.tracking_system_name})</span>' if data.has_tracking and data.tracking_system_name else ''}
                            </td>
                        </tr>
                    </table>
                </section>

                <!-- Pain Points -->
                <section style="margin-bottom: 36px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Key Pain Points</h2>
                    
                    <div style="background: #fef2f2; border-left: 3px solid #f472b6; padding: 18px 20px; border-radius: 6px;">
                        <p style="margin: 0; font-size: 14px; color: #9f1239; line-height: 1.6;">{data.pain_points}</p>
                    </div>
                </section>

                <!-- Accreditation History -->
                <section style="margin-bottom: 36px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Accreditation History</h2>
                    
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #fafafa;">
                        <div style="margin-bottom: 14px;">
                            <span style="font-size: 13px; color: #64748b;">Accrediting Body:</span>
                            <span style="font-size: 14px; font-weight: 600; color: #1e293b; margin-left: 8px;">{data.accrediting_name}</span>
                        </div>
                        <div style="margin-bottom: 14px;">
                            <span style="font-size: 13px; color: #64748b;">Last Audit Date:</span>
                            <span style="font-size: 14px; font-weight: 600; color: #1e293b; margin-left: 8px;">{data.last_audit_date}</span>
                        </div>
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                            <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px;">Findings:</div>
                            {findings_html}
                        </div>
                    </div>
                </section>

                <!-- Additional Information -->
                {f'''<section>
                    <h2 style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Additional Notes</h2>
                    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; border: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">{data.additional_info}</p>
                    </div>
                </section>''' if data.additional_info else ''}

            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    Generated {data.date} • Crown Point Consulting Operations Review
                </p>
            </div>

        </div>
    </body>
    </html>
    """

@gatekeeper_router.post("/api/gatekeeper", status_code=201)
async def submit_audit(data: AuditData, background_tasks: BackgroundTasks):

    try:
        email_str = generate_html_email(data)
        background_tasks.add_task(send_audit_confirmation, SENDER_EMAIL, data.facility_name, email_str )
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)
