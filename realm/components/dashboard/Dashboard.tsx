
import React, { useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { AppState } from '../../types';
// Added CardFooter to the imported components from Atomic
import { StatCard, Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../shared/Atomic';

const LOGO_URL = "https://crownpointconsult.com/assets/bg_less_logo.png";

interface DashboardProps {
  state: AppState;
  onNavigate: (view: any, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const stats = useMemo(() => {
    const total = state.instances.length;
    const drafts = state.instances.filter(i => i.status === 'draft').length;
    
    let criticalFindings = 0;
    state.instances.forEach(i => {
      const res = Object.values(i.responses);
      criticalFindings += res.filter(r => r.riskLevel === 'Critical').length;
    });

    const avgCompliance = total > 0 ? 
      Math.round(state.instances.reduce((acc, i) => {
        const res = Object.values(i.responses);
        if (res.length === 0) return acc;
        const compliant = res.filter(r => r.status === 'Compliant').length;
        return acc + (compliant / res.length);
      }, 0) / total * 100) : 0;
      
    return { total, drafts, avgCompliance, criticalFindings };
  }, [state.instances]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor clinical compliance and facility audits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {}}>
            <Lucide.Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => onNavigate('new-audit')}>
            <Lucide.Plus className="h-4 w-4" />
            New Audit
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Audits" value={stats.drafts} icon={Lucide.FileText} trend="+2" />
        <StatCard label="Avg Compliance" value={`${stats.avgCompliance}%`} icon={Lucide.ShieldCheck} trend="+4.1%" />
        <StatCard label="Critical Risks" value={stats.criticalFindings} icon={Lucide.AlertTriangle} trend={stats.criticalFindings > 0 ? "+1" : "0"} />
        <StatCard label="Templates" value={Object.values(state.masterData).filter(Boolean).length} icon={Lucide.Layout} />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audits</CardTitle>
              <CardDescription>View and manage current facility assessments.</CardDescription>
            </CardHeader>
            <CardContent>
              {state.instances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Lucide.Inbox className="h-10 w-10 text-slate-200 mb-4" />
                  <p className="text-sm font-medium text-slate-500">No audits found</p>
                  <Button variant="link" onClick={() => onNavigate('new-audit')}>Create your first audit</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.instances.map(i => (
                    <div 
                      key={i.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onNavigate('audit-form', i.id)}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">{i.facilityName}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{i.category}</Badge>
                          <span className="text-[10px] text-slate-400">{new Date(i.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Progress</span>
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="bg-slate-900 h-full transition-all" 
                              style={{ width: `${Math.min(100, (Object.keys(i.responses).length / 20) * 100)}%` }} 
                            />
                          </div>
                        </div>
                        <Lucide.ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Library Status</CardTitle>
              <CardDescription>Available audit standards and templates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(state.masterData).map(([cat, data]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${data ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Lucide.Book className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{cat}</span>
                  </div>
                  <Badge variant={data ? 'success' : 'outline'}>{data ? 'Active' : 'Missing'}</Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" onClick={() => onNavigate('upload')}>
                Manage Templates
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-slate-50 border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lucide.Info className="h-5 w-5" />
                Audit Pro-Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 leading-relaxed italic">
                "Systematic documentation of sterile processing lapses is the first step toward a high-reliability surgical environment."
              </p>
            </CardContent>
            {/* Added CardFooter which was previously missing from imports */}
            <CardFooter className="justify-between border-t border-slate-800 pt-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Crown Point Insights</span>
              <img src={LOGO_URL} className="h-6 w-6 invert opacity-50" alt="Logo" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
