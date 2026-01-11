from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class FacilityAuditForm(BaseModel):
    bot_field: Optional[str] = None

    date: str

    facility_name: str
    facility_address: str
    trauma_level: str

    is_affiliated: Literal['y', 'n']  # y / n
    system_name: Optional[str] = None

    contact_name: str
    contact_title: str
    contact_phone: str
    contact_email: EmailStr

    accrediting_org: str
    last_audit_date: str

    has_findings: Literal['y', 'n']  # y / n
    finding_1: Optional[str] = None
    finding_2: Optional[str] = None
    finding_3: Optional[str] = None
    finding_4: Optional[str] = None

    reporting_structure: str

    ft_fmla: str
    ft_active: str
    pt: str
    per_diem: str
    travelers: str

    hours_operation: str

    or_count: str
    clinic_count: str

    proc_endoscopes: Optional[str] = None
    proc_arthroscopic: Optional[str] = None
    proc_tee_probes: Optional[str] = None

    has_tracking: Literal['y', 'n']
    tracking_system_name: Optional[str] = None

    pain_points: str
    additional_info: Optional[str] = None

gatekeeper_router = APIRouter(
    prefix="/gatekeeper",
    tags=["gatekeeper", "requests","emails"],
)

@gatekeeper_router.post("/", tags=["gatekeeper"])
async def get_request(form_data: FacilityAuditForm):
    print(f"Data recieved: {form_data}")
