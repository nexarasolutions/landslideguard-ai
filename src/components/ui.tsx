import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Risk } from '../types';

export const RC: Record<Risk, string> = { Low: '#22c55e', Moderate: '#eab308', High: '#f97316', Critical: '#ef4444' };

export const DemoBadge = () => (
  <span className="rounded border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">DEMO DATA</span>
);
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
export function Async({ loading, error, retry, children }: { loading: boolean; error: string | null; retry: () => void; children: ReactNode }) {
  if (loading) return <div className="flex h-40 items-center justify-center gap-2 text-slate-400" role="status"><Loader2 className="animate-spin" size={18} />Loading…</div>;
  if (error) return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-red-300" role="alert">
      <AlertTriangle size={20} /><p>Could not load data: {error}</p>
      <button onClick={retry} className="rounded bg-line px-3 py-1 text-slate-100">Retry</button>
    </div>
  );
  return <>{children}</>;
}
export const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <label className="flex flex-col gap-1 text-xs text-slate-400">{label}
    <select value={value} onChange={e => onChange(e.target.value)} className="rounded-md border border-line bg-navy px-2 py-1.5 text-sm text-slate-100">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </label>
);
