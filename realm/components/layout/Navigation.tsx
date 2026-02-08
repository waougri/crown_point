
import React from 'react';
import * as Lucide from 'lucide-react';

export const SideNavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all ${
      active ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-primary-50 hover:text-primary-700'
    }`}
  >
    <Icon size={18} strokeWidth={2.5} />
    {label}
  </button>
);

export const MobileNavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center flex-1 py-3 gap-0.5 transition-colors ${
      active ? 'text-primary-600' : 'text-slate-400'
    }`}
  >
    <Icon size={20} strokeWidth={2.5} />
    <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);
