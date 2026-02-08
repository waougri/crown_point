package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/mailjet/mailjet-apiv3-go/v4"
)

type DateInterval struct {
	Start string `json:"start"`
	End   string `json:"end"`
}
type AuditType string

const (
	CSSD      AuditType = "CSSD"
	ENDOSCOPY AuditType = "Endoscopy"
	DENTAL    AuditType = "Dental"
)

type AuditData struct {
	DateIntervals      []DateInterval `json:"date_intervals"`
	AuditType          []AuditType    `json:"audit_type"`
	FacilityName       string         `json:"facility_name"`
	FacilityAddress    string         `json:"facility_address"`
	IsAffiliated       bool           `json:"is_affiliated"`
	SystemName         *string        `json:"system_name,omitempty"`
	TraumaLevel        string         `json:"trauma_level"`
	ContactName        string         `json:"contact_name"`
	ContactTitle       string         `json:"contact_title"`
	ContactPhone       string         `json:"contact_phone"`
	ContactEmail       string         `json:"contact_email"`
	ReportingTo        string         `json:"reporting_to"`
	AccreditingName    string         `json:"accrediting_name"`
	LastAuditDate      string         `json:"last_audit_date"`
	HasFindings        bool           `json:"has_findings"`
	Findings           []string       `json:"findings"`
	StaffFtWFmla       string         `json:"staff_ft_w_fmla"`
	StaffPt            string         `json:"staff_pt"`
	StaffPd            string         `json:"staff_pd"`
	StaffTravelers     string         `json:"staff_travelers"`
	HoursOperation     string         `json:"hours_operation"`
	OrCount            string         `json:"or_count"`
	ClinicCount        string         `json:"clinic_count"`
	ProcEndoscopes     bool           `json:"proc_endoscopes"`
	ProcVascular       bool           `json:"proc_vascular"`
	ProcArthroscopic   bool           `json:"proc_arthroscopic"`
	ProcRobotic        bool           `json:"proc_robotic"`
	ProcTee            bool           `json:"proc_tee"`
	HasTracking        bool           `json:"has_tracking"`
	TrackingSystemName *string        `json:"tracking_system_name,omitempty"`
	PainPoints         string         `json:"pain_points"`
	AdditionalInfo     *string        `json:"additional_info,omitempty"`
	AreasOfFocus       []string       `json:"areas_of_focus"`
	BotCheck           *string        `json:"bot_check,omitempty"`
}

func enableCors(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	// Handle preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusNoContent)
		return true
	}
	return false
}
func GenerateHtmlEmail(data AuditData) (string, error) {
	// Prepare scope items
	var scopeItems []string
	if data.ProcEndoscopes {
		scopeItems = append(scopeItems, "Endoscopes")
	}
	if data.ProcVascular {
		scopeItems = append(scopeItems, "Vascular/Heart")
	}
	if data.ProcArthroscopic {
		scopeItems = append(scopeItems, "Arthroscopic")
	}
	if data.ProcRobotic {
		scopeItems = append(scopeItems, "Robotic")
	}
	if data.ProcTee {
		scopeItems = append(scopeItems, "TEE Probes")
	}

	scopeStr := "Standard Processing"
	if len(scopeItems) > 0 {
		scopeStr = strings.Join(scopeItems, ", ")
	}

	// Format audit types
	var auditTypeStrs []string
	for _, at := range data.AuditType {
		auditTypeStrs = append(auditTypeStrs, string(at))
	}
	auditTypeDisplay := strings.Join(auditTypeStrs, ", ")
	if auditTypeDisplay == "" {
		auditTypeDisplay = "Operational Review"
	}

	// Prepare template data
	templateData := struct {
		Data               AuditData
		ScopeItems         []string
		ScopeStr           string
		AuditTypeDisplay   string
		HasSpecializedProc bool
	}{
		Data:               data,
		ScopeItems:         scopeItems,
		ScopeStr:           scopeStr,
		AuditTypeDisplay:   auditTypeDisplay,
		HasSpecializedProc: len(scopeItems) > 0,
	}

	tmplSource := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            margin: 0; 
            padding: 40px 20px; 
            color: #1a202c; 
            line-height: 1.6;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 20px; 
            overflow: hidden; 
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        /* Header Styles */
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 50px 40px; 
            text-align: center; 
            color: white; 
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }
        .header-badge { 
            background: rgba(255, 255, 255, 0.2); 
            backdrop-filter: blur(10px);
            display: inline-block; 
            padding: 8px 20px; 
            border-radius: 50px; 
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            margin-bottom: 15px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .header h1 { 
            font-size: 32px; 
            font-weight: 800; 
            margin: 0; 
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
            display: block;
            position: relative;
            z-index: 1;
        }
        .header-subtitle {
            font-size: 15px;
            margin-top: 12px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
            font-weight: 500;
        }
        
        /* Section Styles */
        .section { 
            padding: 35px 40px; 
            border-bottom: 2px solid #f7fafc; 
        }
        .section:last-of-type {
            border-bottom: none;
        }
        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
        }
        .section-icon {
            font-size: 24px;
            margin-right: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .section-title { 
            color: #2d3748; 
            font-size: 14px; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
            margin: 0;
        }
        
        /* Grid Layout */
        .info-grid { 
            display: grid;
            gap: 16px;
        }
        .info-row { 
            display: grid;
            grid-template-columns: 160px 1fr;
            align-items: start;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label { 
            font-weight: 700; 
            font-size: 12px; 
            color: #64748b; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .value { 
            font-size: 15px; 
            color: #1e293b; 
            font-weight: 500;
        }
        .value strong {
            color: #0f172a;
            font-weight: 700;
        }
        .value a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
        }
        .value a:hover {
            color: #764ba2;
            text-decoration: underline;
        }
        
        /* Pill Badges */
        .pill { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 6px 16px; 
            border-radius: 50px; 
            font-size: 12px; 
            font-weight: 700; 
            display: inline-block; 
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .pill-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        .pill-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }
        .pill-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        /* Date Intervals */
        .date-intervals {
            display: grid;
            gap: 12px;
        }
        .date-item {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            padding: 18px 24px;
            border-radius: 12px;
            border-left: 4px solid #10b981;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
            font-weight: 600;
            color: #059669;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .date-item::before {
            content: '📅';
            font-size: 24px;
            margin-right: 16px;
        }
        .date-range {
            font-size: 16px;
        }
        
        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 24px 20px;
            border-radius: 12px;
            text-align: center;
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-2px);
        }
        .stat-value {
            font-size: 32px;
            font-weight: 800;
            display: block;
            margin-bottom: 6px;
            line-height: 1;
        }
        .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.95;
            font-weight: 600;
        }
        
        /* Operational Hours */
        .hours-display {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 20px 24px;
            border-radius: 12px;
            border-left: 4px solid #f59e0b;
            margin-top: 16px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
        }
        .hours-display::before {
            content: '🕐';
            font-size: 28px;
            margin-right: 16px;
        }
        .hours-content strong {
            color: #92400e;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 4px;
        }
        .hours-content p {
            color: #78350f;
            font-size: 16px;
            font-weight: 700;
            margin: 0;
        }
        
        /* Facility Resources */
        .resource-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 20px;
        }
        .resource-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            text-align: center;
        }
        .resource-card-icon {
            font-size: 32px;
            margin-bottom: 8px;
            display: block;
        }
        .resource-card-value {
            font-size: 24px;
            font-weight: 800;
            color: #1e293b;
            display: block;
            margin-bottom: 4px;
        }
        .resource-card-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Scope Tags */
        .scope-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 16px;
        }
        .scope-tag {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 8px 18px;
            border-radius: 50px;
            font-size: 13px;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            display: inline-flex;
            align-items: center;
        }
        .scope-tag::before {
            content: '✓';
            margin-right: 6px;
            font-size: 14px;
        }
        
        /* Areas of Focus */
        .focus-areas {
            display: grid;
            gap: 12px;
            margin-top: 16px;
        }
        .focus-item {
            background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
            padding: 16px 20px;
            border-radius: 10px;
            border-left: 4px solid #8b5cf6;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 6px rgba(139, 92, 246, 0.15);
        }
        .focus-item::before {
            content: '🎯';
            font-size: 20px;
            margin-right: 14px;
        }
        .focus-item-text {
            color: #5b21b6;
            font-weight: 600;
            font-size: 14px;
        }
        
        /* Highlight Boxes */
        .highlight-box { 
            background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%); 
            border-left: 4px solid #667eea; 
            border-radius: 12px; 
            padding: 24px 28px; 
            margin-top: 20px; 
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
        }
        .highlight-box-title {
            color: #5046e5;
            display: block;
            margin-bottom: 12px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
        }
        
        /* Pain Points Section */
        .pain-points {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-left: 4px solid #ef4444;
            padding: 24px 28px;
            border-radius: 12px;
            margin-top: 16px;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
        }
        .pain-points-title {
            color: #dc2626;
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
        }
        .pain-points-title::before {
            content: '⚠️';
            font-size: 20px;
            margin-right: 10px;
        }
        .pain-points p {
            margin: 0;
            color: #7f1d1d;
            line-height: 1.7;
            font-size: 15px;
        }
        
        .additional-info {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-left: 4px solid #3b82f6;
            padding: 24px 28px;
            border-radius: 12px;
            margin-top: 16px;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }
        .additional-info-title {
            color: #1d4ed8;
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
        }
        .additional-info-title::before {
            content: '💡';
            font-size: 20px;
            margin-right: 10px;
        }
        .additional-info p {
            margin: 0;
            color: #1e3a8a;
            line-height: 1.7;
            font-size: 15px;
        }
        
        /* Findings List */
        .findings-list {
            margin-top: 12px;
            padding-left: 0;
            list-style: none;
        }
        .findings-list li {
            padding: 12px 0 12px 36px;
            position: relative;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
            line-height: 1.6;
        }
        .findings-list li:last-child {
            border-bottom: none;
        }
        .findings-list li::before {
            content: '⚠️';
            position: absolute;
            left: 0;
            font-size: 18px;
            top: 12px;
        }
        .no-findings {
            color: #059669;
            margin: 12px 0 0 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            font-size: 15px;
        }
        .no-findings::before {
            content: '✅';
            margin-right: 10px;
            font-size: 20px;
        }
        
        /* Tracking System */
        .tracking-status {
            margin-top: 16px;
            padding: 18px 24px;
            border-radius: 10px;
            display: flex;
            align-items: center;
        }
        .tracking-yes {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-left: 4px solid #10b981;
        }
        .tracking-no {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-left: 4px solid #ef4444;
        }
        .tracking-status::before {
            font-size: 24px;
            margin-right: 14px;
        }
        .tracking-yes::before {
            content: '✓';
            color: #059669;
        }
        .tracking-no::before {
            content: '✗';
            color: #dc2626;
        }
        .tracking-content strong {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .tracking-yes .tracking-content strong {
            color: #065f46;
        }
        .tracking-no .tracking-content strong {
            color: #991b1b;
        }
        .tracking-content p {
            margin: 0;
            font-weight: 700;
            font-size: 15px;
        }
        .tracking-yes .tracking-content p {
            color: #047857;
        }
        .tracking-no .tracking-content p {
            color: #b91c1c;
        }
        
        /* Footer */
        .footer { 
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
            padding: 35px 40px; 
            text-align: center; 
            color: #cbd5e1;
        }
        .footer-text {
            font-size: 13px;
            margin-bottom: 10px;
            line-height: 1.6;
        }
        .footer-logo {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.8;
            font-weight: 700;
        }
        
        /* Summary Banner */
        .summary-banner {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 20px 28px;
            margin: 20px 40px;
            border-radius: 12px;
            border-left: 4px solid #f59e0b;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
        }
        .summary-banner strong {
            color: #92400e;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 8px;
        }
        .summary-stats {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
            margin-top: 12px;
        }
        .summary-stat {
            display: flex;
            align-items: center;
            color: #78350f;
            font-weight: 600;
            font-size: 14px;
        }
        .summary-stat::before {
            content: '•';
            margin-right: 8px;
            font-size: 20px;
            color: #d97706;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <span class="header-icon">🏥</span>
            <div class="header-badge">New Service Request</div>
            <h1>{{.AuditTypeDisplay}}</h1>
            <p class="header-subtitle">Pre-Audit Assessment Submission</p>
        </div>

        <!-- Quick Summary Banner -->
        <div class="summary-banner">
            <strong>📊 Request Overview</strong>
            <div class="summary-stats">
                <div class="summary-stat">{{len .Data.DateIntervals}} Requested Window(s)</div>
                <div class="summary-stat">{{.Data.OrCount}} Operating Rooms</div>
                {{if .Data.ClinicCount}}
                <div class="summary-stat">{{.Data.ClinicCount}} Clinics</div>
                {{end}}
                {{if .HasSpecializedProc}}
                <div class="summary-stat">{{len .ScopeItems}} Specialized Procedures</div>
                {{end}}
            </div>
        </div>

        <!-- Facility Information -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">🏢</span>
                <h2 class="section-title">Facility Information</h2>
            </div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="label">Facility Name</div>
                    <div class="value"><strong>{{.Data.FacilityName}}</strong></div>
                </div>
                <div class="info-row">
                    <div class="label">Address</div>
                    <div class="value">{{.Data.FacilityAddress}}</div>
                </div>
                <div class="info-row">
                    <div class="label">Affiliation</div>
                    <div class="value">
                        {{if .Data.IsAffiliated}}
                            <strong>{{if .Data.SystemName}}{{.Data.SystemName}}{{else}}Affiliated System{{end}}</strong>
                        {{else}}
                            Independent Facility
                        {{end}}
                    </div>
                </div>
                <div class="info-row">
                    <div class="label">Trauma Level</div>
                    <div class="value"><span class="pill">{{.Data.TraumaLevel}}</span></div>
                </div>
            </div>
        </div>

        <!-- Requested Audit Windows -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">📆</span>
                <h2 class="section-title">Requested Audit Windows</h2>
            </div>
            <div class="date-intervals">
                {{range $index, $interval := .Data.DateIntervals}}
                <div class="date-item">
                    <span class="date-range">{{$interval.Start}} → {{$interval.End}}</span>
                </div>
                {{end}}
            </div>
        </div>

        <!-- Primary Contact -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">👤</span>
                <h2 class="section-title">Primary Point of Contact</h2>
            </div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="label">Contact Person</div>
                    <div class="value"><strong>{{.Data.ContactName}}</strong></div>
                </div>
                <div class="info-row">
                    <div class="label">Title/Position</div>
                    <div class="value">{{.Data.ContactTitle}}</div>
                </div>
                <div class="info-row">
                    <div class="label">Email Address</div>
                    <div class="value"><a href="mailto:{{.Data.ContactEmail}}">{{.Data.ContactEmail}}</a></div>
                </div>
                <div class="info-row">
                    <div class="label">Phone Number</div>
                    <div class="value">{{.Data.ContactPhone}}</div>
                </div>
                <div class="info-row">
                    <div class="label">Reports To</div>
                    <div class="value">{{.Data.ReportingTo}}</div>
                </div>
            </div>
        </div>

        <!-- Staffing Overview -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">👥</span>
                <h2 class="section-title">Staffing Overview</h2>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">{{.Data.StaffFtWFmla}}</span>
                    <span class="stat-label">Full-Time w/ FMLA</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">{{.Data.StaffPt}}</span>
                    <span class="stat-label">Part-Time</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">{{.Data.StaffPd}}</span>
                    <span class="stat-label">Per Diem</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">{{.Data.StaffTravelers}}</span>
                    <span class="stat-label">Travelers</span>
                </div>
            </div>
        </div>

        <!-- Facility Operations -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">⚙️</span>
                <h2 class="section-title">Facility Operations</h2>
            </div>
            
            <div class="resource-grid">
                <div class="resource-card">
                    <span class="resource-card-icon">🏥</span>
                    <span class="resource-card-value">{{.Data.OrCount}}</span>
                    <span class="resource-card-label">Operating Rooms</span>
                </div>
                <div class="resource-card">
                    <span class="resource-card-icon">🏢</span>
                    <span class="resource-card-value">{{.Data.ClinicCount}}</span>
                    <span class="resource-card-label">Clinic Locations</span>
                </div>
            </div>
            
            <div class="hours-display">
                <div class="hours-content">
                    <strong>Hours of Operation</strong>
                    <p>{{.Data.HoursOperation}}</p>
                </div>
            </div>
        </div>

        <!-- Procedural Capabilities & Scope -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">🔬</span>
                <h2 class="section-title">Procedural Capabilities & Scope</h2>
            </div>
            
            {{if .HasSpecializedProc}}
            <div class="highlight-box">
                <span class="highlight-box-title">Specialized Procedures Performed</span>
                <div class="scope-tags">
                    {{range .ScopeItems}}
                    <span class="scope-tag">{{.}}</span>
                    {{end}}
                </div>
            </div>
            {{else}}
            <div class="highlight-box">
                <span class="highlight-box-title">Procedure Scope</span>
                <p style="color: #5046e5; margin: 8px 0 0 0; font-weight: 600;">Standard Processing Only</p>
            </div>
            {{end}}
        </div>

        <!-- Tracking System -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">📊</span>
                <h2 class="section-title">Instrument Tracking System</h2>
            </div>
            
            {{if .Data.HasTracking}}
            <div class="tracking-status tracking-yes">
                <div class="tracking-content">
                    <strong>Tracking System in Place</strong>
                    <p>{{if .Data.TrackingSystemName}}{{.Data.TrackingSystemName}}{{else}}System Implemented{{end}}</p>
                </div>
            </div>
            {{else}}
            <div class="tracking-status tracking-no">
                <div class="tracking-content">
                    <strong>No Tracking System</strong>
                    <p>Manual tracking methods in use</p>
                </div>
            </div>
            {{end}}
        </div>

        <!-- Areas of Focus -->
        {{if .Data.AreasOfFocus}}
        <div class="section">
            <div class="section-header">
                <span class="section-icon">🎯</span>
                <h2 class="section-title">Requested Areas of Focus</h2>
            </div>
            
            <div class="focus-areas">
                {{range .Data.AreasOfFocus}}
                <div class="focus-item">
                    <span class="focus-item-text">{{.}}</span>
                </div>
                {{end}}
            </div>
        </div>
        {{end}}

        <!-- Pain Points & Challenges -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">📋</span>
                <h2 class="section-title">Pain Points & Additional Information</h2>
            </div>
            
            <div class="pain-points">
                <div class="pain-points-title">Primary Concerns & Challenges</div>
                <p>{{.Data.PainPoints}}</p>
            </div>
            
            {{if .Data.AdditionalInfo}}
            <div class="additional-info">
                <div class="additional-info-title">Additional Context</div>
                <p>{{.Data.AdditionalInfo}}</p>
            </div>
            {{end}}
        </div>

        <!-- Regulatory & Compliance History -->
        <div class="section">
            <div class="section-header">
                <span class="section-icon">📜</span>
                <h2 class="section-title">Regulatory & Compliance History</h2>
            </div>
            
            <div class="info-grid">
                <div class="info-row">
                    <div class="label">Accrediting Body</div>
                    <div class="value"><strong>{{.Data.AccreditingName}}</strong></div>
                </div>
                <div class="info-row">
                    <div class="label">Last Audit Date</div>
                    <div class="value">{{.Data.LastAuditDate}}</div>
                </div>
                <div class="info-row">
                    <div class="label">Findings Status</div>
                    <div class="value">
                        {{if .Data.HasFindings}}
                            <span class="pill pill-warning">Findings Reported</span>
                        {{else}}
                            <span class="pill pill-success">No Findings</span>
                        {{end}}
                    </div>
                </div>
            </div>
            
            <div class="highlight-box">
                <span class="highlight-box-title">Previous Audit Findings</span>
                {{if .Data.Findings}}
                <ul class="findings-list">
                    {{range .Data.Findings}}
                    <li>{{.}}</li>
                    {{end}}
                </ul>
                {{else}}
                <p class="no-findings">No findings from previous audit</p>
                {{end}}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                This is an automated notification from the Pre-Audit Assessment Portal<br>
                Please retain this email for your records
            </div>
            <div class="footer-logo">Crown Point Consulting</div>
        </div>
    </div>
</body>
</html>`

	// Parse and execute template
	tmpl, err := template.New("email").Parse(tmplSource)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, templateData); err != nil {
		return "", err
	}

	return buf.String(), nil
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	mj := mailjet.NewMailjetClient(os.Getenv("MAILJET_API_KEY"), os.Getenv("MAILJET_SECRET_KEY"))
	mux := http.NewServeMux()
	mux.HandleFunc(
		"/health",
		func(w http.ResponseWriter, r *http.Request) {

			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			_, err := w.Write([]byte("{\"ping\": \"pong\"}"))
			if err != nil {
				log.Fatal(err)
			}
		},
	)
	mux.HandleFunc("/gatekeeper", func(w http.ResponseWriter, r *http.Request) {
		var auditRequest AuditData
		if enableCors(w, r) {
			return
		}
		decoder := json.NewDecoder(r.Body)
		if decoder == nil {
			w.WriteHeader(http.StatusBadRequest)
		}
		decoder.DisallowUnknownFields()
		err := decoder.Decode(&auditRequest)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		prettyJSON, err := json.MarshalIndent(auditRequest, "", "    ")
		if err == nil {
			fmt.Println(string(prettyJSON))
		}

		temp, err := GenerateHtmlEmail(auditRequest)
		fmt.Println(temp)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		msgs := []mailjet.InfoMessagesV31{
			{
				From: &mailjet.RecipientV31{Email: os.Getenv("SENDER_EMAIL"), Name: "Crown Point Gatekeeper"},
				To: &mailjet.RecipientsV31{
					{Email: os.Getenv("RECIPIENT_EMAIL"), Name: "Recipient"},
				},
				Subject:  fmt.Sprintf("%s has submitted an audit request!", auditRequest.FacilityName),
				HTMLPart: temp,
			},
		}
		messages := mailjet.MessagesV31{Info: msgs}
		res, err := mj.SendMailV31(&messages)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		log.Default().Printf("Mailjet response: %v", res)

	})
	log.Fatal(http.ListenAndServe(":8080", mux))
}
