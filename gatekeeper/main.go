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
	AuditType          AuditType      `json:"audit_type"`
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
	// 1. Prepare Scope Tags (Logic equivalent to Python's scope_items)
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

	// 2. Define the Enhanced Template
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
                max-width: 700px; 
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
            
            /* Section Styles */
            .section { 
                padding: 35px 40px; 
                border-bottom: 2px solid #f7fafc; 
                transition: background 0.3s ease;
            }
            .section:hover {
                background: #fafbfc;
            }
            .section-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
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
                font-size: 13px; 
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
                grid-template-columns: 140px 1fr;
                align-items: start;
                padding: 12px 0;
                border-bottom: 1px solid #f1f5f9;
            }
            .info-row:last-child {
                border-bottom: none;
            }
            .label { 
                font-weight: 700; 
                font-size: 13px; 
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
                font-size: 13px; 
                font-weight: 700; 
                display: inline-block; 
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            /* Highlight Boxes */
            .highlight-box { 
                background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%); 
                border-left: 4px solid #667eea; 
                border-radius: 12px; 
                padding: 20px 24px; 
                margin-top: 16px; 
                font-size: 15px;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
            }
            .highlight-box strong {
                color: #5046e5;
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            /* Date Intervals */
            .date-intervals {
                display: grid;
                gap: 12px;
            }
            .date-item {
                background: white;
                padding: 16px 20px;
                border-radius: 10px;
                border-left: 4px solid #10b981;
                box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                font-weight: 600;
                color: #059669;
                display: flex;
                align-items: center;
            }
            .date-item::before {
                content: '📅';
                font-size: 20px;
                margin-right: 12px;
            }
            
            /* Stats Cards */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-top: 20px;
            }
            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            .stat-value {
                font-size: 28px;
                font-weight: 800;
                display: block;
                margin-bottom: 4px;
            }
            .stat-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                opacity: 0.9;
                font-weight: 600;
            }
            
            /* Pain Points Section */
            .pain-points {
                background: #fef2f2;
                border-left: 4px solid #ef4444;
                padding: 20px 24px;
                border-radius: 12px;
                margin-bottom: 16px;
            }
            .pain-points strong {
                color: #dc2626;
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .pain-points p {
                margin: 0;
                color: #7f1d1d;
                line-height: 1.7;
            }
            
            .additional-info {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 20px 24px;
                border-radius: 12px;
            }
            .additional-info strong {
                color: #1d4ed8;
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .additional-info p {
                margin: 0;
                color: #1e3a8a;
                line-height: 1.7;
            }
            
            /* Findings List */
            .findings-list {
                margin-top: 12px;
                padding-left: 0;
                list-style: none;
            }
            .findings-list li {
                padding: 10px 0 10px 32px;
                position: relative;
                color: #475569;
                border-bottom: 1px solid #e2e8f0;
            }
            .findings-list li:last-child {
                border-bottom: none;
            }
            .findings-list li::before {
                content: '⚠️';
                position: absolute;
                left: 0;
                font-size: 18px;
            }
            
            /* Footer */
            .footer { 
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
                padding: 30px 40px; 
                text-align: center; 
                color: #cbd5e1;
            }
            .footer-text {
                font-size: 13px;
                margin-bottom: 8px;
            }
            .footer-logo {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 2px;
                opacity: 0.7;
                font-weight: 700;
            }
            
            /* Scope Tags */
            .scope-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
            }
            .scope-tag {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 6px 14px;
                border-radius: 50px;
                font-size: 12px;
                font-weight: 700;
                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <span class="header-icon">🏥</span>
                <div class="header-badge">New Service Request</div>
                <h1>{{.Data.AuditType}} Operational Review</h1>
            </div>

            <!-- Facility Information -->
            <div class="section">
                <div class="section-header">
                    <span class="section-icon">🏢</span>
                    <h2 class="section-title">Facility Information</h2>
                </div>
                <div class="info-grid">
                    <div class="info-row">
                        <div class="label">Facility</div>
                        <div class="value"><strong>{{.Data.FacilityName}}</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="label">Address</div>
                        <div class="value">{{.Data.FacilityAddress}}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">System</div>
                        <div class="value">{{if .Data.IsAffiliated}}{{.Data.SystemName}}{{else}}Independent{{end}}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Trauma Level</div>
                        <div class="value"><span class="pill">{{.Data.TraumaLevel}}</span></div>
                    </div>
                </div>
            </div>

            <!-- Requested Windows -->
            <div class="section">
                <div class="section-header">
                    <span class="section-icon">📆</span>
                    <h2 class="section-title">Requested Windows</h2>
                </div>
                <div class="date-intervals">
                    {{range .Data.DateIntervals}}
                    <div class="date-item">{{.Start}} to {{.End}}</div>
                    {{end}}
                </div>
            </div>

            <!-- Point of Contact -->
            <div class="section">
                <div class="section-header">
                    <span class="section-icon">👤</span>
                    <h2 class="section-title">Point of Contact</h2>
                </div>
                <div class="info-grid">
                    <div class="info-row">
                        <div class="label">Contact</div>
                        <div class="value"><strong>{{.Data.ContactName}}</strong> ({{.Data.ContactTitle}})</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Email</div>
                        <div class="value"><a href="mailto:{{.Data.ContactEmail}}">{{.Data.ContactEmail}}</a></div>
                    </div>
                    <div class="info-row">
                        <div class="label">Phone</div>
                        <div class="value">{{.Data.ContactPhone}}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Reporting To</div>
                        <div class="value">{{.Data.ReportingTo}}</div>
                    </div>
                </div>
            </div>

            <!-- Operations & Scope -->
            <div class="section">
                <div class="section-header">
                    <span class="section-icon">⚙️</span>
                    <h2 class="section-title">Operations & Scope</h2>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">{{.Data.StaffFtWFmla}}</span>
                        <span class="stat-label">Full-Time Staff</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">{{.Data.StaffPt}}</span>
                        <span class="stat-label">Part-Time Staff</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">{{.Data.StaffPd}}</span>
                        <span class="stat-label">Per Diem Staff</span>
                    </div>
                </div>
                
                <div class="info-grid" style="margin-top: 24px;">
                    <div class="info-row">
                        <div class="label">Main ORs</div>
                        <div class="value"><strong>{{.Data.OrCount}} Operating Rooms</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="label">Tracking System</div>
                        <div class="value">{{if .Data.TrackingSystemName}}{{.Data.TrackingSystemName}}{{else}}None{{end}}</div>
                    </div>
                </div>
                
                {{if ne .ScopeStr "Standard Processing"}}
                <div class="highlight-box" style="margin-top: 20px;">
                    <strong>🔬 Specialized Procedures</strong>
                    <div class="scope-tags">
                        {{range $index, $item := .ScopeItems}}
                        <span class="scope-tag">{{$item}}</span>
                        {{end}}
                    </div>
                </div>
                {{end}}
            </div>

            <!-- Pain Points & Notes -->
            <div class="section">
                <div class="section-header">
                    <span class="section-icon">📋</span>
                    <h2 class="section-title">Pain Points & Additional Notes</h2>
                </div>
                
                <div class="pain-points">
                    <strong>🔴 Primary Concerns</strong>
                    <p>{{.Data.PainPoints}}</p>
                </div>
                
                {{if .Data.AdditionalInfo}}
                <div class="additional-info">
                    <strong>💡 Additional Information</strong>
                    <p>{{.Data.AdditionalInfo}}</p>
                </div>
                {{end}}
            </div>

            <!-- Regulatory History -->
            <div class="section" style="border-bottom: none;">
                <div class="section-header">
                    <span class="section-icon">📜</span>
                    <h2 class="section-title">Regulatory History</h2>
                </div>
                
                <div class="info-grid">
                    <div class="info-row">
                        <div class="label">Accreditor</div>
                        <div class="value"><strong>{{.Data.AccreditingName}}</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="label">Last Audit</div>
                        <div class="value">{{.Data.LastAuditDate}}</div>
                    </div>
                </div>
                
                <div class="highlight-box" style="margin-top: 20px;">
                    <strong>Past Audit Findings</strong>
                    {{if .Data.Findings}}
                    <ul class="findings-list">
                        {{range .Data.Findings}}
                        <li>{{.}}</li>
                        {{end}}
                    </ul>
                    {{else}}
                    <p style="color: #059669; margin: 8px 0 0 0; font-weight: 600;">✅ No findings reported</p>
                    {{end}}
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-text">This is an automated notification from the Pre-Audit Assessment Portal</div>
                <div class="footer-logo">Crown Point Consulting</div>
            </div>
        </div>
    </body>
    </html>`

	// 3. Parse and execute the template
	tmpl, err := template.New("email").Parse(tmplSource)
	if err != nil {
		return "", fmt.Errorf("template parse error: %w", err)
	}

	var buf bytes.Buffer
	templateData := struct {
		Data       AuditData
		ScopeStr   string
		ScopeItems []string
	}{
		Data:       data,
		ScopeStr:   scopeStr,
		ScopeItems: scopeItems,
	}

	err = tmpl.Execute(&buf, templateData)
	if err != nil {
		return "", fmt.Errorf("template execute error: %w", err)
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
