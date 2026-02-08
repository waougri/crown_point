
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { AppState, AuditInstance, AuditCategory, AuditResponse } from './types';
import { CloudStorage } from './services/storageService';
import { parseAuditExcel } from './services/excelService';

// Module Imports
import { SideNavItem, MobileNavItem } from './components/layout/Navigation';
import { CloudSyncStatus, Button, Input, Badge, Card } from './components/shared/Atomic';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuditForm } from './components/audit/AuditForm';

const LOGO_URL = "https://crownpointconsult.com/assets/bg_less_logo.png";

const App = () => {
	const [view, setView] = useState<'dashboard' | 'upload' | 'new-audit' | 'audit-form'>('dashboard');
	const [activeId, setActiveId] = useState<string | null>(null);
	const [isSyncing, setIsSyncing] = useState(false);
	const [state, setState] = useState<AppState>({
		masterData: { "Sterile Processing (CSSD)": null, "Endoscopy": null, "Dental": null },
		instances: []
	});

	// Initial Boot Sequence
	useEffect(() => {
		CloudStorage.fetchState().then(s => s && setState(s));
	}, []);


	// Continuous Cloud Syncing
	useEffect(() => {
		const sync = async () => {
			setIsSyncing(true);
			await CloudStorage.saveState(state);
			setIsSyncing(false);
		};
		sync();
	}, [state]);

	// Handlers
	const navigate = (v: typeof view, id: string | null = null) => {
		setView(v);
		setActiveId(id);
		window.scrollTo(0, 0);
	};

	const updateResponse = (instId: string, findId: string, upd: Partial<AuditResponse>) => {
		setState(prev => ({
			...prev,
			instances: prev.instances.map(i => {
				if (i.id !== instId) return i;
				const existing = i.responses[findId] || { findingId: findId, status: 'Unanswered', notes: '', images: [] };
				return { ...i, updatedAt: Date.now(), responses: { ...i.responses, [findId]: { ...existing, ...upd } } };
			})
		}));
	};

	const handleFileUpload = async (file: File, cat: AuditCategory) => {
		setIsSyncing(true);
		const report = await parseAuditExcel(file, cat);
		setState(prev => ({ ...prev, masterData: { ...prev.masterData, [cat]: report } }));
		setIsSyncing(false);
	};

	const createAudit = (name: string, cat: AuditCategory) => {
		const i: AuditInstance = {
			id: `audit-${Date.now()}`,
			facilityName: name,
			category: cat,
			status: 'draft',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			completedBy: ['Lead Consultant'],
			engagementPartner: 'Lead Consultant',
			responses: {}
		};
		setState(prev => ({ ...prev, instances: [i, ...prev.instances] }));
		navigate('audit-form', i.id);
	};

	return (
		<div className="flex flex-col lg:flex-row min-h-screen bg-slate-50/50">
			{/* Sidebar Navigation */}
			<aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-50">
				<div className="p-6 flex items-center gap-3">
					<img src={LOGO_URL} alt="Logo" className="h-8 w-8 object-contain" />
					<div className="flex flex-col">
						<span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">Crown Point</span>
						<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Auditor Portal</span>
					</div>
				</div>
				<nav className="flex-1 px-4 space-y-1">
					<SideNavItem icon={Lucide.LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => navigate('dashboard')} />
					<SideNavItem icon={Lucide.FileSpreadsheet} label="Templates" active={view === 'upload'} onClick={() => navigate('upload')} />
					<SideNavItem icon={Lucide.PlusCircle} label="New Audit" active={view === 'new-audit'} onClick={() => navigate('new-audit')} />
				</nav>
				<div className="p-4 border-t border-slate-100">
					<CloudSyncStatus isSyncing={isSyncing} />
				</div>
			</aside>

			{/* Mobile Navigation */}
			<nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50 shadow-lg pb-[env(safe-area-inset-bottom)]">
				<MobileNavItem icon={Lucide.LayoutDashboard} label="Home" active={view === 'dashboard'} onClick={() => navigate('dashboard')} />
				<MobileNavItem icon={Lucide.PlusCircle} label="Audit" active={view === 'new-audit'} onClick={() => navigate('new-audit')} />
				<MobileNavItem icon={Lucide.Settings} label="Setup" active={view === 'upload'} onClick={() => navigate('upload')} />
			</nav>

			{/* Content Area */}
			<div className="flex-1 min-h-screen flex flex-col">
				<header className="sticky top-0 z-50 h-12 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 lg:px-10 flex items-center justify-between">
					<div className="flex items-center gap-3 lg:hidden">
						<img src={LOGO_URL} alt="Logo" className="h-6 w-6 object-contain" />
						<span className="font-bold text-slate-900 text-xs tracking-tight uppercase">Crown Point</span>
					</div>
					<div className="flex-1" />
					<div className="flex items-center gap-3">
						<Badge variant="secondary" className="hidden sm:inline-flex text-[9px]">V3.0 Enterprise</Badge>
						<div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
							<Lucide.User size={14} />
						</div>
					</div>
				</header>

				<main className="flex-1 p-4 lg:p-10 pb-24 max-w-7xl mx-auto w-full">
					{view === 'dashboard' && <Dashboard state={state} onNavigate={navigate} />}
					{view === 'audit-form' && activeId && (
						<AuditForm
							instanceId={activeId}
							state={state}
							onUpdateResponse={updateResponse}
							onNavigate={navigate}
							setIsSyncing={setIsSyncing}
						/>
					)}
					{view === 'upload' && <UploadView state={state} onUpload={handleFileUpload} isSyncing={isSyncing} />}
					{view === 'new-audit' && <NewAuditView state={state} onCreate={createAudit} />}
				</main>
			</div>
		</div>
	);
};

const UploadView = ({ state, onUpload, isSyncing }: any) => (
	<div className="max-w-2xl mx-auto py-10 space-y-10 animate-slide-up">
		<div className="text-center space-y-4">
			<h2 className="text-3xl font-bold tracking-tight text-slate-900">Library Sync</h2>
			<p className="text-slate-500 text-sm max-w-md mx-auto">Update your clinical standards by uploading master Excel templates.</p>
		</div>
		<div className="grid gap-4">
			{(Object.keys(state.masterData) as AuditCategory[]).map(cat => {
				const loaded = !!state.masterData[cat];
				return (
					<Card key={cat} className="p-4 flex items-center justify-between hover:border-slate-300 transition-colors">
						<div className="flex items-center gap-4">
							<div className={`p-3 rounded-lg ${loaded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
								<Lucide.FileSpreadsheet size={20} />
							</div>
							<div className="min-w-0">
								<h4 className="font-bold text-sm text-slate-900">{cat}</h4>
								<p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
									{loaded ? 'Template active' : 'Sync required'}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<input type="file" id={`up-${cat}`} className="hidden" accept=".xlsx" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], cat)} />
							<Button asChild variant="outline" size="sm" className="h-8">
								<label htmlFor={`up-${cat}`} className="cursor-pointer flex items-center gap-2">
									<Lucide.CloudUpload size={14} className={isSyncing ? 'animate-pulse' : ''} />
									{loaded ? 'Update' : 'Upload'}
								</label>
							</Button>
						</div>
					</Card>
				);
			})}
		</div>
	</div>
);

const NewAuditView = ({ state, onCreate }: any) => {
	const [fac, setFac] = useState('');
	const [cat, setCat] = useState<AuditCategory>("Sterile Processing (CSSD)");
	return (
		<div className="max-w-md mx-auto py-10 space-y-8 animate-slide-up">
			<div className="text-center">
				<h2 className="text-3xl font-bold tracking-tight text-slate-900">Initiate Audit</h2>
				<p className="text-sm text-slate-500 mt-2">Deploy a new assessment session for a facility.</p>
			</div>
			<Card className="p-6 space-y-6">
				<div className="space-y-2">
					<label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Facility Identification</label>
					<Input
						placeholder="e.g. St. Jude Medical Center"
						className="h-11 font-medium"
						value={fac}
						onChange={(e: any) => setFac(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Engagement Framework</label>
					<div className="grid gap-2">
						{(Object.keys(state.masterData) as AuditCategory[]).map(c => (
							<button
								key={c}
								onClick={() => setCat(c)}
								className={`flex items-center justify-between p-3 rounded-md border text-xs font-bold transition-all ${cat === c ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
									}`}
							>
								{c}
								{cat === c && <Lucide.Check size={14} />}
							</button>
						))}
					</div>
				</div>
				<Button
					disabled={!fac.trim() || !state.masterData[cat]}
					onClick={() => onCreate(fac, cat)}
					className="w-full h-11 text-base shadow-lg"
				>
					Deploy Audit Session
				</Button>
				{!state.masterData[cat] && (
					<p className="text-center text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2 animate-pulse">Master template missing</p>
				)}
			</Card>
		</div>
	);
};

export default App;
