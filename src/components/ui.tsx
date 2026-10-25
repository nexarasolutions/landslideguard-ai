import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Risk } from '../types';

export const RC: Record<Risk, string> = { Low: '#22c55e', Moderate: '#eab308', High: '#f97316', Critical: '#ef4444' };

export const LiveStatusBadge = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
    LIVE TELEMETRY
  </span>
);

// Backward compatibility alias so no imports break
export const DemoBadge = LiveStatusBadge;

export const RiskBadge = ({ r }: { r: Risk }) => (
  <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-black" style={{ background: RC[r] }}>{r}</span>
);

export const Pill = ({ risk }: { risk: Risk }) => <RiskBadge r={risk} />;

export const Card = ({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) => (
  <section className="rounded-xl border border-line bg-panel p-4 shadow-sm">
    {title && <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-slate-100">{title}</h2>{right}</div>}
    {children}
  </section>
);

export function Async({
  loading,
  error,
  retry,
  hasData = false,
  children
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
  hasData?: boolean;
  children: ReactNode;
}) {
  // If we already have data, keep the UI static and don't wipe children
  if (loading && !hasData) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-slate-400" role="status">
        <Loader2 className="animate-spin" size={18} />Loading…
      </div>
    );
  }
  if (error && !hasData) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-red-300" role="alert">
        <AlertTriangle size={20} />
        <p>Could not load data: {error}</p>
        <button onClick={retry} className="rounded bg-line px-3 py-1 text-slate-100">Retry</button>
      </div>
    );
  }
  return <>{children}</>;
}

export const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <label className="flex flex-col gap-1 text-xs text-slate-400">{label}
    <select value={value} onChange={e => onChange(e.target.value)} className="rounded-md border border-line bg-navy px-2 py-1.5 text-sm text-slate-100">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </label>
);
