
import React from 'react';
import * as Lucide from 'lucide-react';

export const Button = React.forwardRef<HTMLButtonElement, any>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90 shadow',
      destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/90 shadow-sm',
      outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 shadow-sm',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80 shadow-sm',
      ghost: 'hover:bg-slate-100 hover:text-slate-900',
      link: 'text-slate-900 underline-offset-4 hover:underline',
    };

    const sizes: Record<string, string> = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export const Card = ({ className = '', children, ...props }: any) => (
  <div
    className={`rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className = '', ...props }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }: any) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight font-sans ${className}`} {...props} />
);

export const CardDescription = ({ className = '', ...props }: any) => (
  <p className={`text-sm text-slate-500 ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }: any) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

export const CardFooter = ({ className = '', ...props }: any) => (
  <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
);

export const Input = React.forwardRef<HTMLInputElement, any>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));

export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    className={`flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));

export const Badge = ({ className = '', variant = 'default', ...props }: any) => {
  const variants: Record<string, string> = {
    default: 'border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80',
    secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80',
    destructive: 'border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80',
    outline: 'text-slate-950 border-slate-200',
    success: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export const Progress = ({ value = 0, className = '' }: { value: number; className?: string }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
    <div
      className="h-full w-full flex-1 bg-slate-900 transition-all duration-500"
      style={{ transform: `translateX(-${100 - value}%)` }}
    />
  </div>
);

export const StatCard = ({ label, value, icon: Icon, trend }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</CardTitle>
      <Icon className="h-4 w-4 text-slate-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend} from last month
        </p>
      )}
    </CardContent>
  </Card>
);

export const CloudSyncStatus = ({ isSyncing }: { isSyncing: boolean }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors border border-slate-200 ${isSyncing ? 'bg-slate-50' : 'bg-white'}`}>
    <Lucide.RefreshCcw size={14} className={`${isSyncing ? 'text-blue-600 animate-spin' : 'text-slate-400'}`} />
    <span className="text-xs font-medium text-slate-600">
      {isSyncing ? 'Syncing...' : 'Connected'}
    </span>
  </div>
);
