
import React, { useState, useRef, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { AuditInstance, AppState, AuditSection, AuditResponse } from '../../types';
import { AuditItem } from './AuditItem';
import { CloudStorage } from '../../services/storageService';
import { Button, Progress, Badge, Card, Input } from '../shared/Atomic';

interface AuditFormProps {
	instanceId: string;
	state: AppState;
	onUpdateResponse: (instId: string, findId: string, upd: Partial<AuditResponse>) => void;
	onNavigate: (view: any) => void;
	setIsSyncing: (s: boolean) => void;
}

export const AuditForm: React.FC<AuditFormProps> = ({
	instanceId, state, onUpdateResponse, onNavigate, setIsSyncing
}) => {
	const inst = state.instances.find((i: { id: any; }) => i.id === instanceId);
	const master = inst ? state.masterData[inst.category] : null;
	const [filter, setFilter] = useState<'All' | AuditSection>('All');
	const [searchQuery, setSearchQuery] = useState('');
	const fileRef = useRef<HTMLInputElement>(null);
	const [uploadingId, setUploadingId] = useState<string | null>(null);

	if (!inst || !master) return (
		<div className="flex flex-col items-center justify-center h-64 text-slate-400">
			<Lucide.Loader2 className="animate-spin mb-4" />
			<p className="text-sm font-medium">Preparing audit session...</p>
		</div>
	);

	const sections = Object.keys(master.sections) as AuditSection[];

	const filteredItems = useMemo(() => {
		let items = filter === 'All' ? Object.values(master.sections).flat() : master.sections[filter] || [];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			items = items.filter(f =>
				f.equipmentSubject.toLowerCase().includes(query) ||
				f.issue.toLowerCase().includes(query) ||
				f.aamiReference.toLowerCase().includes(query) ||
				f.recommendation.toLowerCase().includes(query)
			);
		}

		return items;
	}, [master.sections, filter, searchQuery]);

	const totalPossible = Object.values(master.sections).flat().length;
	const answeredCount = Object.keys(inst.responses).length;
	const progress = totalPossible > 0 ? Math.round((answeredCount / totalPossible) * 100) : 0;

	const riskStats = useMemo(() => {
		const res = Object.values(inst.responses);
		return {
			critical: res.filter(r => r.riskLevel === 'Critical').length,
			major: res.filter(r => r.riskLevel === 'Major').length,
			minor: res.filter(r => r.riskLevel === 'Minor').length,
		};
	}, [inst.responses]);

	const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && uploadingId) {
			setIsSyncing(true);
			const cloudUrl = await CloudStorage.uploadAsset(file, `audit_${inst.id}_${uploadingId}`);
			const existing = inst.responses[uploadingId]?.images || [];
			onUpdateResponse(inst.id, uploadingId, { images: [...existing, cloudUrl] });
			setIsSyncing(false);
			setUploadingId(null);
		}
	};

	return (
		<div className="space-y-6 pb-24 max-w-7xl mx-auto">
			{/* Sticky Top Navigation Panel */}
			<div className="sticky top-12 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')} className="rounded-full h-8 w-8">
						<Lucide.ArrowLeft size={16} />
					</Button>
					<div className="min-w-0">
						<h2 className="text-sm font-bold truncate text-slate-900">{inst.facilityName}</h2>
						<div className="flex items-center gap-2 mt-0.5">
							<Badge variant="outline" className="text-[9px] uppercase tracking-wider">{inst.category}</Badge>
							<span className="text-[10px] text-slate-400 font-medium">Session ID: {inst.id.slice(-6)}</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-6">
					<div className="hidden lg:flex items-center gap-4 border-l border-slate-100 pl-6">
						<RiskMetric label="Crit" count={riskStats.critical} color="bg-red-500" />
						<RiskMetric label="Maj" count={riskStats.major} color="bg-amber-500" />
						<div className="flex flex-col items-end gap-1 min-w-[120px]">
							<div className="flex justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
								<span>Audit Progress</span>
								<span className="text-slate-900">{progress}%</span>
							</div>
							<Progress value={progress} className="h-1.5" />
						</div>
					</div>
					<Button size="sm" onClick={() => onNavigate('dashboard')} className="shadow-sm">
						Save & Exit
					</Button>
				</div>
			</div>

			{/* Sub-navigation and Filtering */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
					<TabButton active={filter === 'All'} onClick={() => setFilter('All')} label="All Sections" />
					{sections.map(s => (
						<TabButton key={s} active={filter === s} onClick={() => setFilter(s)} label={s} />
					))}
				</div>

				<div className="relative group max-w-md">
					<Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
					<Input
						placeholder="Search findings or standards..."
						className="pl-9 h-10"
						value={searchQuery}
						onChange={(e: any) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Main content Area */}
			<div className="space-y-4">
				{filteredItems.length === 0 ? (
					<Card className="flex flex-col items-center justify-center py-20 text-center border-dashed">
						<Lucide.Search className="h-10 w-10 text-slate-200 mb-4" />
						<p className="text-sm font-medium text-slate-500">No matching criteria found.</p>
						<Button variant="link" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button>
					</Card>
				) : (
					filteredItems.map((f, idx) => (
						<AuditItem
							key={f.id}
							index={idx}
							finding={f}
							response={inst.responses[f.id] || { findingId: f.id, status: 'Unanswered', notes: '', images: [] }}
							onUpdate={(upd) => onUpdateResponse(inst.id, f.id, upd)}
							onAddPhoto={() => { setUploadingId(f.id); fileRef.current?.click(); }}
						/>
					))
				)}
			</div>

			<input type="file" ref={fileRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageCapture} />
		</div>
	);
};

const TabButton = ({ active, onClick, label }: any) => (
	<button
		onClick={onClick}
		className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${active
			? 'bg-slate-900 text-slate-50 shadow-sm'
			: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
			}`}
	>
		{label}
	</button>
);

const RiskMetric = ({ label, count, color }: { label: string; count: number; color: string }) => (
	<div className="flex items-center gap-1.5">
		<span className={`h-2 w-2 rounded-full ${color}`} />
		<span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
		<span className="text-xs font-bold">{count}</span>
	</div>
);
