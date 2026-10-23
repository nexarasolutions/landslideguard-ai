import { useState } from 'react';
import { BatteryLow, SignalHigh, WifiOff } from 'lucide-react';
import type { Station } from '../types';
import { Card, DemoBadge, RiskBadge, Select } from '../components/ui';

const statusCls = { online: 'text-green-400', stale: 'text-yellow-300', offline: 'text-red-400' } as const;

export default function Live({ stations, open }: { stations: Station[]; open: (id: string) => void }) {
  const [risk, setRisk] = useState('All'); const [status, setStatus] = useState('All'); const [q, setQ] = useState('');
  const rows = stations.filter(s => (risk === 'All' || s.risk === risk) && (status === 'All' || s.status === status) &&
    (s.name + s.id).toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Live monitoring stations" right={<DemoBadge />}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">Search location or ID
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. Site A" className="rounded-md border border-line bg-navy px-2 py-1.5 text-sm text-slate-100" /></label>
        <Select label="Risk level" value={risk} onChange={setRisk} options={['All', 'Low', 'Moderate', 'High', 'Critical']} />
        <Select label="Sensor status" value={status} onChange={setStatus} options={['All', 'online', 'stale', 'offline']} />
      </div>
      {rows.length === 0 ? <p className="py-10 text-center text-slate-400">No stations match these filters. Clear a filter to see all stations.</p> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs text-slate-400"><tr>
            <th className="py-2">Station</th><th>Lat, Lng</th><th>Rain (mm/h)</th><th>Soil (%)</th><th>Tilt (°)</th><th>Vib. (mm/s)</th><th>Battery</th><th>Signal</th><th>Last reading</th><th>Status</th><th>Risk</th></tr></thead>
          <tbody>{rows.map(s => (
            <tr key={s.id} className="cursor-pointer border-t border-line hover:bg-navy/60" tabIndex={0} onClick={() => open(s.id)} onKeyDown={e => e.key === 'Enter' && open(s.id)}>
              <td className="py-2"><b>{s.id}</b><br /><span className="text-xs text-slate-400">{s.name}</span></td>
              <td>{s.lat}, {s.lng}</td>
              {s.status === 'offline' ? <td colSpan={4} className="text-slate-500">No current data</td> : <><td>{s.rainfall}</td><td>{s.soil}</td><td>{s.tilt}</td><td>{s.vibration}</td></>}
              <td className={s.battery < 25 ? 'text-red-300' : ''}>{s.battery < 25 && <BatteryLow className="mr-1 inline" size={14} />}{s.battery}%</td>
              <td><SignalHigh className="mr-1 inline" size={14} />{s.signal}%</td>
              <td>{s.lastSeenMin} min ago</td>
              <td className={statusCls[s.status]}>{s.status === 'offline' && <WifiOff className="mr-1 inline" size={14} />}{s.status}</td>
              <td>{s.status === 'offline' ? <span className="text-slate-500">Unavailable</span> : <RiskBadge r={s.risk} />}</td>
            </tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}
