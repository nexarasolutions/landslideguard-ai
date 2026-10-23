import { useState } from 'react';
import type { Alert } from '../types';
import { Card, DemoBadge, RiskBadge, Select } from '../components/ui';

export default function Alerts({ alerts, ack }: { alerts: Alert[]; ack: (id: string) => Promise<void> }) {
  const [sev, setSev] = useState('All'); const [st, setSt] = useState('All'); const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const rows = alerts.filter(a => (sev === 'All' || a.severity === sev) && (st === 'All' || (st === 'Open') === !a.acknowledged));
  const go = async (id: string) => { setBusy(id); await ack(id); setBusy(null); setConfirm(null); };
  return (
    <Card title="Alerts & notifications" right={<DemoBadge />}>
      <div className="mb-4 flex gap-3">
        <Select label="Severity" value={sev} onChange={setSev} options={['All', 'Low', 'Moderate', 'High', 'Critical']} />
        <Select label="Status" value={st} onChange={setSt} options={['All', 'Open', 'Acknowledged']} />
      </div>
      {rows.length === 0 ? <p className="py-10 text-center text-slate-400">No alerts match these filters.</p> :
        <ul className="space-y-3">{rows.map(a => (
          <li key={a.id} className="rounded-lg border border-line bg-navy p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2"><RiskBadge r={a.severity} /><b>{a.id}</b> · {a.location} ({a.stationId})</span>
              <span className="text-xs text-slate-400">{a.time}</span>
            </div>
            <p className="mt-2 text-sm">{a.description}</p>
            <p className="text-xs text-slate-400">Triggering readings: {a.trigger}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {a.acknowledged ? <span className="text-green-400">Acknowledged · {a.responder}</span> :
                confirm === a.id ? <>
                  <span>Acknowledge this alert?</span>
                  <button disabled={busy === a.id} onClick={() => go(a.id)} className="rounded bg-accent px-3 py-1 font-medium text-navy">{busy === a.id ? 'Saving…' : 'Confirm'}</button>
                  <button onClick={() => setConfirm(null)} className="rounded bg-line px-3 py-1">Cancel</button></> :
                <button onClick={() => setConfirm(a.id)} className="rounded bg-accent px-3 py-1 font-medium text-navy">Acknowledge</button>}
              <span className="text-xs text-slate-500">Delivery: not confirmed</span>
            </div>
          </li>))}</ul>}
    </Card>
  );
}
