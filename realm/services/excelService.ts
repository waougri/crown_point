
import * as xlsx from 'xlsx';
import { AuditFinding, AuditReport, AuditSection, AuditCategory } from '../types';

// Updated function signature to include AuditCategory, which is required to construct a valid AuditReport object.
export const parseAuditExcel = async (file: File, category: AuditCategory): Promise<AuditReport> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = xlsx.read(data, { type: 'array' });

                const report: AuditReport = {
                    // Fix: Added missing required 'category' property to comply with the AuditReport interface.
                    category,
                    sections: {},
                    version: new Date().toISOString(),
                    updatedAt: Date.now()
                };

                workbook.SheetNames.forEach(sheetName => {
                    const ws = workbook.Sheets[sheetName];
                    const rawData = xlsx.utils.sheet_to_json(ws, { defval: "" });

                    // Map raw data to AuditFinding interface
                    const findings: AuditFinding[] = rawData.map((row: any, index: number) => ({
                        // Fix: Using category prefix in ID ensures uniqueness across different audit standards.
                        id: `${category}-${sheetName}-${index}`,
                        equipmentSubject: row["Equipment/Subject"] || row["equipmentSubject"] || "",
                        issue: row["issue"] || "",
                        rationale: row["rationale"] || "",
                        recommendation: row["recommendation"] || "",
                        aamiReference: row["AAMIreference"] || row["aamiReference"] || ""
                    })).filter(f => f.equipmentSubject || f.issue);

                    // Check if sheetName is a valid section or map it
                    const validSections: AuditSection[] = ["General", "PrepandPack", "Sterilization", "Storage", "Point-of-Use", "Decon"];
                    if (validSections.includes(sheetName as AuditSection)) {
                        report.sections[sheetName as AuditSection] = findings;
                    }
                });

                resolve(report);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}