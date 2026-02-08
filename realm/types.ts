
export interface AuditFinding {
    id: string;
    equipmentSubject: string;
    issue: string;
    rationale: string;
    recommendation: string;
    aamiReference: string;
    riskLevel?: 'Critical' | 'Major' | 'Minor';
}

export type AuditSection =
    | "General"
    | "PrepandPack"
    | "Sterilization"
    | "Storage"
    | "Point-of-Use"
    | "Decon";

export type AuditCategory = "Sterile Processing (CSSD)" | "Endoscopy" | "Dental";

export interface AuditReport {
    category: AuditCategory;
    sections: {
        [key in AuditSection]?: AuditFinding[];
    };
    version: string;
    updatedAt: number;
}

export type ResponseStatus = 'Compliant' | 'Non-Compliant' | 'N/A' | 'Unanswered';

export interface AuditResponse {
    findingId: string;
    status: ResponseStatus;
    notes: string;
    images: string[];
    riskLevel?: 'Critical' | 'Major' | 'Minor';
    capaRequired?: boolean; // Corrective Action Preventive Action
}

export interface AuditInstance {
    id: string;
    facilityName: string;
    category: AuditCategory;
    status: 'draft' | 'submitted' | 'under-review';
    createdAt: number;
    updatedAt: number;
    completedBy: string[];
    engagementPartner: string;
    responses: Record<string, AuditResponse>;
}

export interface AppState {
    masterData: Record<AuditCategory, AuditReport | null>;
    instances: AuditInstance[];
}
