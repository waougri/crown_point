
import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import * as xlsx from 'xlsx';
import { 
    AuditFinding, 
    AuditReport, 
    AuditSection, 
    AuditInstance, 
    AuditResponse, 
    ResponseStatus, 
    AppState, 
    AuditCategory 
} from './types';

type View = 'dashboard' | 'upload' | 'new-audit' | 'audit-form';

const App = () => {
    const [view, setView] = useState<View>('dashboard');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [state, setState] = useState<AppState>(() => {
        const saved = localStorage.getItem('realm_audit_v5');
        return saved ? JSON.parse(saved) : {
            masterData: {
                "Sterile Processing (CSSD)": null,
                "Endoscopy": null,
                "Dental": null
            },
            instances: []
        };
    });

    useEffect(() => {
        localStorage.setItem('realm_audit_v5', JSON.stringify(state));
    }, [state]);

    const navigate = (newView: View, id: string | null = null) => {
        setView(newView);
        setActiveId(id);
        setIsSidebarOpen(false);
        window.scrollTo(0, 0);
    };

    const handleFileUpload = async (file: File, category: AuditCategory) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = xlsx.read(data, { type: 'array' });
            
            const report: AuditReport = {
                category,
                sections: {},
                version: new Date().toISOString(),
                updatedAt: Date.now()
            };

            const validSections: AuditSection[] = ["General", "PrepandPack", "Sterilization", "Storage", "Point-of-Use", "Decon"];

            workbook.SheetNames.forEach(sheetName => {
                const ws = workbook.Sheets[sheetName];
                const rawData = xlsx.utils.sheet_to_json(ws, { defval: "" });
                
                const findings: AuditFinding[] = rawData.map((row: any, index: number) => ({
                    id: `${category}-${sheetName}-${index}`,
                    equipmentSubject: row["Equipment/Subject"] || row["Subject"] || row["equipmentSubject"] || "N/A",
                    issue: row["Issue"] || row["issue"] || "",
                    rationale: row["Rationale"] || row["rationale"] || "",
                    recommendation: row["Recommendation"] || row["recommendation"] || "",
                    aamiReference: row["AAMI reference"] || row["AAMIreference"] || row["aamiReference"] || ""
                })).filter(f => f.equipmentSubject !== "N/A" || f.issue);

                if (validSections.includes(sheetName as AuditSection)) {
                    report.sections[sheetName as AuditSection] = findings;
                }
            });

            setState(prev => ({ 
                ...prev, 
                masterData: { ...prev.masterData, [category]: report } 
            }));
        };
        reader.readAsArrayBuffer(file);
    };

    const handleCreateAudit = (facilityName: string, category: AuditCategory) => {
        const newInstance: AuditInstance = {
            id: `audit-${Date.now()}`,
            facilityName,
            category,
            status: 'draft',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            completedBy: ['Admin'],
            responses: {}
        };
        setState((prev: { instances: any; }) => ({ ...prev, instances: [newInstance, ...prev.instances] }));
        navigate('audit-form', newInstance.id);
    };

    const handleUpdateResponse = (instanceId: string, findingId: string, updates: Partial<AuditResponse>) => {
        setState(prev => ({
            ...prev,
            instances: prev.instances.map(inst => {
                if (inst.id !== instanceId) return inst;
                const existing = inst.responses[findingId] || { findingId, status: 'Unanswered', notes: '', images: [] };
                return {
                    ...inst,
                    updatedAt: Date.now(),
                    responses: {
                        ...inst.responses,
                        [findingId]: { ...existing, ...updates }
                    }
                };
            })
        }));
    };

    const handleImageUpload = (instanceId: string, findingId: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            const inst = state.instances.find(i => i.id === instanceId);
            const currentImages = inst?.responses[findingId]?.images || [];
            handleUpdateResponse(instanceId, findingId, { images: [...currentImages, base64] });
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (instanceId: string, findingId: string, index: number) => {
        const inst = state.instances.find(i => i.id === instanceId);
        const currentImages = [...(inst?.responses[findingId]?.images || [])];
        currentImages.splice(index, 1);
        handleUpdateResponse(instanceId, findingId, { images: currentImages });
    };

    const handleSubmitAudit = (instanceId: string) => {
        if (confirm("Finalize assessment? This will lock all data for this facility.")) {
            setState(prev => ({
                ...prev,
                instances: prev.instances.map(inst => 
                    inst.id === instanceId ? { ...inst, status: 'submitted', updatedAt: Date.now() } : inst
                )
            }));
            navigate('dashboard');
        }
    };

    const handleDeleteInstance = (id: string) => {
        if (confirm("Permanently delete this audit?")) {
            setState(prev => ({ ...prev, instances: prev.instances.filter(i => i.id !== id) }));
        }
    };

    // --- Common Layout ---
    const Layout = ({ children }: { children: React.ReactNode }) => (
        <div className="flex flex-col lg:flex-row min-h-screen relative">
            {/* Sidebar / Mobile Nav Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            
            <aside className={`
                fixed lg:sticky top-0 bottom-0 left-0 z-[70]
                w-[280px] bg-white border-r border-slate-200 
                flex flex-col transition-transform duration-300
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-8">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('dashboard')}>
                        <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-soft">
                            <Lucide.ShieldCheck size={24} />
                        </div>
                        <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-primary-900 to-accent-600 bg-clip-text text-transparent tracking-tighter">Realm</h1>
                    </div>
                </div>
                
                <nav className="flex-1 px-4 py-4 space-y-2">
                    <NavItem icon={<Lucide.LayoutGrid size={20}/>} label="Operations" active={view === 'dashboard'} onClick={() => navigate('dashboard')} />
                    <NavItem icon={<Lucide.Database size={20}/>} label="Standards" active={view === 'upload'} onClick={() => navigate('upload')} />
                    <NavItem icon={<Lucide.PlusCircle size={20}/>} label="New Review" active={view === 'new-audit'} onClick={() => navigate('new-audit')} />
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <div className="bg-primary-50 p-4 rounded-3xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xs shrink-0">QA</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-primary-900 truncate">Lead Auditor</p>
                            <p className="text-[10px] text-primary-600 uppercase font-black tracking-widest">Enterprise</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 flex items-center px-4 lg:px-10">
                    <button className="lg:hidden p-2 -ml-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}>
                        <Lucide.Menu size={24} />
                    </button>
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
                            <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div> Online</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                        <button className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:text-primary-600 transition-colors">
                            <Lucide.Bell size={18} />
                        </button>
                    </div>
                </header>
                
                <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );

    const NavItem = ({ icon, label, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-sm ${
                active 
                ? 'bg-primary-600 text-white shadow-soft ring-4 ring-primary-50' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-primary-700'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    // --- Dashboard View ---
    const DashboardView = () => {
        const active = state.instances.filter(i => i.status === 'draft');
        const completed = state.instances.filter(i => i.status === 'submitted');

        return (
            <div className="space-y-10 animate-fade">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Audit Dashboard</h2>
                        <p className="text-slate-500 font-medium">Compliance overview and active assessment tracking.</p>
                    </div>
                    <button onClick={() => navigate('new-audit')} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-3xl font-bold shadow-soft transition-all flex items-center justify-center gap-2">
                        <Lucide.Plus size={20}/>
                        New Assessment
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                    <MetricCard icon={<Lucide.Activity className="text-amber-500"/>} label="Drafts" value={active.length} />
                    <MetricCard icon={<Lucide.CheckCircle2 className="text-green-500"/>} label="Finalized" value={completed.length} />
                    <MetricCard icon={<Lucide.Zap className="text-primary-500"/>} label="Data Points" value={state.instances.reduce((acc, i) => acc + Object.keys(i.responses).length, 0)} />
                    <MetricCard icon={<Lucide.Layout className="text-accent-500"/>} label="Reports" value={state.instances.length} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-2 space-y-6">
                        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-primary-600 rounded-full"></div>
                            In-Progress Reviews
                        </h3>
                        {active.length === 0 ? (
                            <div className="bg-white rounded-4xl p-16 text-center border border-dashed border-slate-200">
                                <Lucide.FileSearch className="mx-auto text-slate-200 mb-4" size={56} />
                                <p className="text-slate-400 font-bold text-xl">No active audits found.</p>
                                <button onClick={() => navigate('new-audit')} className="mt-4 text-primary-600 font-bold hover:underline">Start one now</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {active.map(inst => {
                                    const master = state.masterData[inst.category];
                                    const all = master ? Object.values(master.sections).flat() : [];
                                    const progress = all.length > 0 ? Math.round((Object.keys(inst.responses).length / all.length) * 100) : 0;

                                    return (
                                        <div key={inst.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-glass group hover:border-primary-200 transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{inst.category}</span>
                                                <button onClick={() => handleDeleteInstance(inst.id)} className="text-slate-200 hover:text-red-500"><Lucide.Trash2 size={16}/></button>
                                            </div>
                                            <h4 className="text-2xl font-bold text-slate-900 truncate mb-1">{inst.facilityName}</h4>
                                            <p className="text-xs text-slate-400 font-bold mb-8">UPDATED {new Date(inst.updatedAt).toLocaleDateString()}</p>
                                            
                                            <div className="space-y-3 mb-8">
                                                <div className="flex justify-between text-[11px] font-black uppercase text-slate-400">
                                                    <span>Completion</span>
                                                    <span className="text-primary-700">{progress}%</span>
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="bg-primary-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => navigate('audit-form', inst.id)}
                                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                Resume <Lucide.ArrowRight size={16}/>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-slate-800">Recent Archives</h3>
                        <div className="space-y-3">
                            {completed.length === 0 ? (
                                <p className="text-slate-300 text-sm italic">No completed audits available.</p>
                            ) : (
                                completed.map(inst => (
                                    <div key={inst.id} className="bg-white p-5 rounded-2xl border border-slate-50 flex items-center gap-4 hover:shadow-soft cursor-pointer transition-all" onClick={() => navigate('audit-form', inst.id)}>
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                            <Lucide.FileCheck size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{inst.facilityName}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{inst.category}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const MetricCard = ({ icon, label, value }: any) => (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-glass flex flex-col gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">{icon}</div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-display font-black text-slate-900">{value}</p>
            </div>
        </div>
    );

    // --- Upload View ---
    const UploadView = () => {
        const cats: AuditCategory[] = ["Sterile Processing (CSSD)", "Endoscopy", "Dental"];
        return (
            <div className="max-w-4xl mx-auto py-12 space-y-16 animate-fade">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-display font-bold text-slate-900">Manage Standards</h2>
                    <p className="text-slate-500 text-lg">Upload AAMI requirement multi-sheet Excel files for each category.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cats.map(cat => {
                        const loaded = !!state.masterData[cat];
                        return (
                            <div key={cat} className="bg-white rounded-4xl p-10 border border-slate-100 shadow-glass flex flex-col items-center text-center space-y-8 relative overflow-hidden group">
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${loaded ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                                    {cat === cats[0] ? <Lucide.Package2 size={40}/> : <Lucide.Microscope size={40}/>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900 leading-tight mb-2">{cat}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{loaded ? 'System Ready' : 'Awaiting Data'}</p>
                                </div>
                                <input type="file" id={`up-${cat}`} className="hidden" accept=".xlsx" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], cat)} />
                                <label htmlFor={`up-${cat}`} className={`w-full py-4 rounded-2xl font-bold text-sm cursor-pointer transition-all ${loaded ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-primary-600 text-white shadow-soft'}`}>
                                    {loaded ? 'Replace Standards' : 'Upload XLSX'}
                                </label>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-slate-900 rounded-5xl p-10 text-white flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-4">
                        <h4 className="text-2xl font-display font-bold">Import Engine Specification</h4>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">System expects tabs: <b>General, PrepandPack, Sterilization, Storage, Point-of-Use, Decon</b>. Columns should include: <i>Equipment/Subject, Issue, Rationale, Recommendation, AAMI reference.</i></p>
                    </div>
                    <Lucide.Cpu className="text-primary-400 opacity-50 shrink-0" size={80} />
                </div>
            </div>
        );
    };

    // --- Audit Form View ---
    const AuditFormView = () => {
        const inst = state.instances.find(i => i.id === activeId);
        const master = inst ? state.masterData[inst.category] : null;
        const [activeTab, setActiveTab] = useState<'All' | AuditSection>('All');
        const [uploadingFor, setUploadingFor] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        if (!inst || !master) return <div>Missing Audit Context</div>;

        const allSecs = Object.keys(master.sections) as AuditSection[];
        const filtered = activeTab === 'All' ? Object.values(master.sections).flat() : master.sections[activeTab] || [];
        const total = Object.values(master.sections).flat().length;
        const progress = Math.round((Object.keys(inst.responses).length / total) * 100);

        return (
            <div className="space-y-8 pb-32 animate-fade">
                {/* Fixed Control Panel */}
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-6 sm:p-8 rounded-4xl sticky top-20 z-40 shadow-soft">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${inst.status === 'submitted' ? 'bg-slate-100 text-slate-400' : 'bg-primary-600 text-white shadow-soft'}`}>
                                {inst.status === 'submitted' ? <Lucide.Lock size={30} /> : <Lucide.ClipboardCheck size={30} />}
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight truncate max-w-md">{inst.facilityName}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-widest">{inst.category}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{total} Checkpoints</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 lg:max-w-xs flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Readiness</span>
                                <span className="text-2xl font-display font-black text-primary-600">{progress}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {inst.status === 'draft' && (
                                <button onClick={() => handleSubmitAudit(inst.id)} className="flex-1 lg:flex-none bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold shadow-soft hover:bg-primary-700 transition-all text-sm">
                                    Finalize
                                </button>
                            )}
                            <button onClick={() => navigate('dashboard')} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100">
                                <Lucide.X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Section Selector Tab Bar - Scrollable and Fixed Layout */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-t border-slate-50 pt-4">
                        <TabButton active={activeTab === 'All'} onClick={() => setActiveTab('All')} label="All Sections" />
                        <div className="w-px h-6 bg-slate-200 mx-2 shrink-0"></div>
                        {allSecs.map(s => {
                            const secTotal = master.sections[s]?.length || 0;
                            const secFilled = master.sections[s]?.filter(f => inst.responses[f.id]?.status !== 'Unanswered').length || 0;
                            const secProg = secTotal > 0 ? Math.round((secFilled/secTotal)*100) : 0;
                            return (
                                <TabButton 
                                    key={s} 
                                    active={activeTab === s} 
                                    onClick={() => setActiveTab(s)} 
                                    label={s} 
                                    progress={secProg}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Audit Items List */}
                <div className="grid grid-cols-1 gap-10">
                    {filtered.map((f, idx) => {
                        const res = inst.responses[f.id];
                        const status = res?.status || 'Unanswered';
                        const isLocked = inst.status === 'submitted';

                        return (
                            <div key={f.id} className={`
                                bg-white rounded-5xl p-8 lg:p-12 border transition-all duration-300 question-card overflow-hidden
                                ${status === 'Non-Compliant' ? 'border-red-200 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.1)]' : 'border-slate-100 shadow-glass'}
                            `}>
                                <div className="flex flex-col xl:flex-row gap-12 lg:gap-16">
                                    <div className="flex-1 space-y-10 min-w-0">
                                        <div className="flex items-start gap-6 sm:gap-8">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center font-display font-black text-2xl shrink-0 border border-slate-100 shadow-inner">
                                                {idx + 1}
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-2xl sm:text-3xl font-display font-black text-slate-900 leading-tight tracking-tight break-words">{f.equipmentSubject}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] font-black text-primary-600 bg-primary-100/50 px-3 py-1.5 rounded-full uppercase tracking-widest">{f.aamiReference}</span>
                                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{activeTab === 'All' ? f.id.split('-')[1] : 'Standard'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <InfoPanel label="Issue Observation" color="bg-orange-50/70 text-orange-800" content={f.issue} />
                                            <InfoPanel label="Remediation Protocol" color="bg-green-50/70 text-green-800" content={f.recommendation} bold />
                                        </div>

                                        {f.rationale && (
                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rationale</span>
                                                <p className="text-xs text-slate-600 leading-relaxed italic whitespace-pre-wrap">{f.rationale}</p>
                                            </div>
                                        )}

                                        {/* Photo Evidence Section */}
                                        <div className="space-y-6 pt-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Evidence ({res?.images?.length || 0})</span>
                                                {!isLocked && (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => { setUploadingFor(f.id); fileInputRef.current?.setAttribute('capture', 'environment'); fileInputRef.current?.click(); }}
                                                            className="flex-1 sm:flex-none text-[10px] font-black text-primary-600 bg-primary-50 px-5 py-3 rounded-2xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest border border-primary-100"
                                                        >
                                                            <Lucide.Camera size={16}/> Camera
                                                        </button>
                                                        <button 
                                                            onClick={() => { setUploadingFor(f.id); fileInputRef.current?.removeAttribute('capture'); fileInputRef.current?.click(); }}
                                                            className="flex-1 sm:flex-none text-[10px] font-black text-slate-400 bg-slate-50 px-5 py-3 rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest border border-slate-100"
                                                        >
                                                            <Lucide.ImagePlus size={16}/> Library
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-4 min-h-[80px]">
                                                {res?.images?.map((img, i) => (
                                                    <div key={i} className="relative w-24 h-24 sm:w-32 sm:h-32 group rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                                        <img src={img} className="w-full h-full object-cover" alt="Audit Evidence" />
                                                        {!isLocked && (
                                                            <button 
                                                                onClick={() => removeImage(inst.id, f.id, i)}
                                                                className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-xl p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Lucide.Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {(!res?.images || res.images.length === 0) && (
                                                    <div className="flex flex-col items-center justify-center w-full py-8 text-slate-300 border-2 border-dashed border-slate-50 rounded-3xl">
                                                        <Lucide.Image size={32} strokeWidth={1}/>
                                                        <span className="text-[10px] font-black uppercase mt-2">No photos attached</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decision and Notes Area */}
                                    <div className="w-full xl:w-[420px] shrink-0 space-y-8 flex flex-col xl:border-l xl:border-slate-100 xl:pl-16">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">Determination</label>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                <StatusBtn 
                                                    active={status === 'Compliant'} 
                                                    disabled={isLocked} 
                                                    label="Compliant" 
                                                    color="green" 
                                                    onClick={() => handleUpdateResponse(inst.id, f.id, { status: 'Compliant' })} 
                                                />
                                                <StatusBtn 
                                                    active={status === 'Non-Compliant'} 
                                                    disabled={isLocked} 
                                                    label="Non-Compliant" 
                                                    color="red" 
                                                    onClick={() => handleUpdateResponse(inst.id, f.id, { status: 'Non-Compliant' })} 
                                                />
                                                <StatusBtn 
                                                    active={status === 'N/A'} 
                                                    disabled={isLocked} 
                                                    label="Not Applicable (N/A)" 
                                                    color="slate" 
                                                    onClick={() => handleUpdateResponse(inst.id, f.id, { status: 'N/A' })} 
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Auditor Notes & Evidence Log</label>
                                            <textarea 
                                                disabled={isLocked}
                                                className="w-full flex-1 min-h-[180px] bg-slate-50/50 border border-slate-100 rounded-3xl p-6 text-sm text-slate-800 focus:ring-4 focus:ring-primary-100 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-300 font-medium"
                                                placeholder="Document specific findings, asset IDs, or personnel interviews..."
                                                value={res?.notes || ''}
                                                onChange={(e) => handleUpdateResponse(inst.id, f.id, { notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Shared Hidden Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && uploadingFor) {
                            handleImageUpload(inst.id, uploadingFor, file);
                            setUploadingFor(null);
                        }
                    }}
                />
            </div>
        );
    };

    const StatusBtn = ({ active, label, color, onClick, disabled }: any) => {
        const base = "py-4 sm:py-5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest border-2 transition-all duration-300 flex items-center justify-center gap-2";
        const configs: any = {
            green: active ? "bg-green-600 text-white border-green-600 shadow-soft scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-green-300 hover:text-green-600",
            red: active ? "bg-red-600 text-white border-red-600 shadow-soft ring-4 ring-red-50 scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-red-300 hover:text-red-600",
            slate: active ? "bg-slate-800 text-white border-slate-800 shadow-soft scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-900"
        };
        return (
            <button disabled={disabled} onClick={onClick} className={`${base} ${configs[color]}`}>
                {active && <Lucide.Check size={14} strokeWidth={4}/>}
                {label}
            </button>
        );
    };

    const TabButton = ({ active, onClick, label, progress }: any) => (
        <button 
            onClick={onClick}
            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap border-2 flex items-center gap-3 shrink-0 ${
                active 
                ? 'bg-primary-600 text-white border-primary-600 shadow-soft scale-105' 
                : 'bg-white text-slate-400 border-slate-200 hover:border-primary-200 hover:text-primary-700'
            }`}
        >
            {label}
            {progress !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold shadow-sm ${active ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {progress}%
                </span>
            )}
        </button>
    );

    const InfoPanel = ({ label, color, content, bold }: any) => (
        <div className={`p-6 sm:p-8 rounded-4xl border border-white/40 shadow-inner space-y-3 ${color}`}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block">{label}</span>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${bold ? 'font-bold' : 'font-medium'}`}>{content}</p>
        </div>
    );

    const NewAuditView = () => {
        const [fac, setFac] = useState('');
        const [cat, setCat] = useState<AuditCategory>("Sterile Processing (CSSD)");
        const cats: AuditCategory[] = ["Sterile Processing (CSSD)", "Endoscopy", "Dental"];
        
        return (
            <div className="max-w-3xl mx-auto py-12 space-y-12 animate-fade">
                <div className="text-center space-y-3">
                    <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Audit Initialization</h2>
                    <p className="text-slate-500 font-medium">Select target facility and methodology to begin review.</p>
                </div>

                <div className="bg-white rounded-5xl p-8 sm:p-12 lg:p-20 border border-slate-100 shadow-glass space-y-12">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Lucide.Building2 size={16}/> Target Facility Identity
                        </label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-6 text-slate-900 focus:ring-4 focus:ring-primary-100 outline-none transition-all font-display font-bold text-2xl placeholder:text-slate-200"
                            placeholder="e.g. Memorial South SPD"
                            value={fac}
                            onChange={(e) => setFac(e.target.value)}
                        />
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Lucide.Layers size={16}/> Audit Category Scope
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {cats.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCat(c)}
                                    className={`p-8 rounded-4xl border-2 text-left transition-all ${
                                        cat === c 
                                        ? 'border-primary-600 bg-primary-50/50 shadow-soft' 
                                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                    <p className={`font-black text-sm transition-colors uppercase tracking-tight ${cat === c ? 'text-primary-900' : 'text-slate-400'}`}>{c}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-50">
                                        {state.masterData[c] ? 'Data Ready' : 'Data Missing'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        disabled={!fac.trim() || !state.masterData[cat]}
                        onClick={() => handleCreateAudit(fac, cat)}
                        className="w-full bg-slate-900 text-white py-6 rounded-4xl font-black shadow-soft disabled:opacity-30 hover:bg-primary-600 transition-all text-xl flex items-center justify-center gap-3"
                    >
                        Begin Assessment <Lucide.ArrowRight size={24}/>
                    </button>
                    {!state.masterData[cat] && <p className="text-center text-xs font-bold text-orange-500 uppercase tracking-widest">Master data for {cat} is required.</p>}
                </div>
            </div>
        );
    };

    return (
        <Layout>
            {view === 'dashboard' && <DashboardView />}
            {view === 'upload' && <UploadView />}
            {view === 'new-audit' && <NewAuditView />}
            {view === 'audit-form' && <AuditFormView />}
        </Layout>
    );
};

export default App;
