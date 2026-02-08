
import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { AuditFinding, AuditResponse } from '../../types';
import { Badge, Button, Card, CardHeader, CardContent, Textarea } from '../shared/Atomic';

interface AuditItemProps {
  index: number;
  finding: AuditFinding;
  response: AuditResponse;
  onUpdate: (updates: Partial<AuditResponse>) => void;
  onAddPhoto: () => void;
}

export const AuditItem: React.FC<AuditItemProps> = ({ 
  index, 
  finding, 
  response, 
  onUpdate, 
  onAddPhoto 
}) => {
  const [showRationale, setShowRationale] = useState(false);
  const isNonCompliant = response.status === 'Non-Compliant';

  return (
    <Card className={`transition-all duration-200 ${isNonCompliant ? 'border-red-200' : ''}`}>
      <div className="flex flex-col md:flex-row">
        {/* Main Info Section */}
        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shrink-0">
              {index + 1}
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold leading-tight">{finding.equipmentSubject}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] py-0">{finding.aamiReference}</Badge>
                <button 
                  onClick={() => setShowRationale(!showRationale)}
                  className="text-[10px] font-semibold text-blue-600 hover:underline"
                >
                  View Rationale
                </button>
              </div>
            </div>
          </div>

          {showRationale && (
            <div className="rounded-md bg-slate-50 p-4 text-xs text-slate-600 border border-slate-100 animate-slide-up">
              <span className="font-bold text-slate-900 block mb-1">Standard Reasoning</span>
              {finding.rationale || "Derived from AAMI standards for clinical excellence."}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-md bg-red-50/50 border border-red-100">
              <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider block mb-1">Observation</span>
              <p className="text-xs text-slate-700 leading-normal italic">"{finding.issue}"</p>
            </div>
            <div className="p-3 rounded-md bg-emerald-50/50 border border-emerald-100">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Remediation</span>
              <p className="text-xs text-slate-700 leading-normal font-medium">{finding.recommendation}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Findings & Evidence</label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 w-12 rounded-lg border-dashed border-2 flex flex-col items-center justify-center p-0"
                onClick={onAddPhoto}
              >
                <Lucide.Camera className="h-4 w-4" />
                <span className="text-[8px] mt-1 font-bold">ADD</span>
              </Button>
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                {response.images.map((img, i) => (
                  <div key={i} className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <img src={img} className="h-full w-full object-cover" alt="Audit evidence" />
                    <button 
                      onClick={() => {
                        const updated = [...response.images];
                        updated.splice(i, 1);
                        onUpdate({ images: updated });
                      }}
                      className="absolute top-0 right-0 bg-slate-900/80 text-white p-0.5 rounded-bl-lg"
                    >
                      <Lucide.X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Section */}
        <div className="w-full md:w-72 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-200 p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Result</label>
            <div className="grid grid-cols-3 gap-1">
              <ResultButton 
                active={response.status === 'Compliant'} 
                variant="success" 
                label="Pass" 
                onClick={() => onUpdate({ status: 'Compliant' })} 
              />
              <ResultButton 
                active={response.status === 'Non-Compliant'} 
                variant="destructive" 
                label="Fail" 
                onClick={() => onUpdate({ status: 'Non-Compliant' })} 
              />
              <ResultButton 
                active={response.status === 'N/A'} 
                variant="outline" 
                label="N/A" 
                onClick={() => onUpdate({ status: 'N/A' })} 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Level</label>
            <div className="grid grid-cols-3 gap-1">
              <RiskLevelBtn active={response.riskLevel === 'Minor'} label="Low" color="bg-emerald-500" onClick={() => onUpdate({ riskLevel: 'Minor' })} />
              <RiskLevelBtn active={response.riskLevel === 'Major'} label="Med" color="bg-amber-500" onClick={() => onUpdate({ riskLevel: 'Major' })} />
              <RiskLevelBtn active={response.riskLevel === 'Critical'} label="High" color="bg-red-500" onClick={() => onUpdate({ riskLevel: 'Critical' })} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Notes</label>
            <Textarea 
              placeholder="Detailed observations..."
              className="h-24 bg-white text-xs resize-none"
              value={response.notes}
              onChange={(e: any) => onUpdate({ notes: e.target.value })}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

const ResultButton = ({ active, variant, label, onClick }: any) => {
  const styles: Record<string, string> = {
    success: active ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50',
    destructive: active ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-red-600 border-slate-200 hover:bg-red-50',
    outline: active ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
  };

  return (
    <button
      onClick={onClick}
      className={`py-2 px-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${styles[variant]}`}
    >
      {label}
    </button>
  );
};

const RiskLevelBtn = ({ active, label, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`py-2 px-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${active ? `${color} text-white border-transparent shadow-sm` : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
  >
    {label}
  </button>
);
