
export interface AuditFinding {
    id: string;
    equipmentSubject: string;
    issue: string;
    rationale: string;
    recommendation: string;
    aamiReference: string;
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
    images: string[]; // Base64 strings
}

export interface AuditInstance {
    id: string;
    facilityName: string;
    category: AuditCategory;
    status: 'draft' | 'submitted';
    createdAt: number;
    updatedAt: number;
    completedBy: string[];
    // Keyed by findingId globally across sections
    responses: Record<string, AuditResponse>;
}

export interface AppState {
    masterData: Record<AuditCategory, AuditReport | null>;
    instances: AuditInstance[];
}
