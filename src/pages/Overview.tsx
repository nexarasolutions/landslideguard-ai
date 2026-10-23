import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../services/api';
import { useAsync } from '../hooks';
import type { Alert, Reading, Risk, Station } from '../types';
import { Async, Card, DemoBadge, RC, RiskBadge } from '../components/ui';
import StationMap from '../components/StationMap';
import Trend from '../components/Trend';

const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null; };

export default function Overview({ stations, alerts, open }: { stations: Station[]; alerts: Alert[]; open: (id: string) => void }) {
  const rd = useAsync(() => Promise.all(stations.map(s => api.readings(s.id))), [stations]);
  const top = [...stations].sort((a, b) => b.score - a.score)[0];
  const n = (f: (s: Station) => boolean) => stations.filter(f).length;
  const kpis: [string, string | number][] = [
    ['Monitoring locations', stations.length], ['Low risk', n(s => s.risk === 'Low')],
    ['Moderate risk', n(s => s.risk === 'Moderate')], ['High / Critical', n(s => s.risk === 'High' || s.risk === 'Critical')],
    ['Online sensors', `${n(s => s.status === 'online')}/${stations.length}`], ['Active alerts', alerts.filter(a => !a.acknowledged).length]
  ];
  const dist = (['Low', 'Moderate', 'High', 'Critical'] as Risk[]).map(r => ({ name: r, value: n(s => s.risk === r) }));
  const all = rd.data;
  const merged: Reading[] = all ? all[0].map((p, i) => ({
    t: p.t, rainfall: avg(all.map(r => r[i].rainfall)), soil: avg(all.map(r => r[i].soil)), tilt: null, vibration: null
  })) : [];
  const topData = all ? all[stations.indexOf(top)] : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kpis.map(([l, v]) => (
          <div key={l} className="rounded-xl border border-line bg-panel p-3">
            <p className="text-xs text-slate-400">{l}</p><p className="mt-1 text-2xl font-semibold text-white">{v}</p>
          </div>))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2"><Card title="Station risk map" right={<DemoBadge />}><StationMap stations={stations} onSelect={open} /></Card></div>
        <Card title="Risk distribution (stations)" right={<DemoBadge />}>
          <div className="h-72" role="img" aria-label="Risk distribution chart"><ResponsiveContainer><PieChart>
            <Pie data={dist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{dist.map(d => <Cell key={d.name} fill={RC[d.name as Risk]} stroke="none" />)}</Pie>
            <Tooltip formatter={(v: unknown) => `${v} stations`} contentStyle={{ background: '#0B1220', border: '1px solid #243049' }} /><Legend />
          </PieChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Async loading={rd.loading} error={rd.error} retry={rd.reload}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Trend title="Rainfall, network average" unit="mm/h" data={merged} lines={[{ k: 'rainfall', name: 'Rainfall', c: '#60a5fa' }]} />
          <Trend title="Soil moisture, network average" unit="%" data={merged} lines={[{ k: 'soil', name: 'Soil moisture', c: '#38bdf8' }]} />
          <Trend title={`Ground tilt · ${top.id}`} unit="°" data={topData} lines={[{ k: 'tilt', name: 'Tilt', c: '#a78bfa' }]} />
          <Trend title={`Vibration · ${top.id}`} unit="mm/s" data={topData} lines={[{ k: 'vibration', name: 'Vibration', c: '#f0abfc' }]} />
        </div>
      </Async>
      <Card title="Recent alerts" right={<DemoBadge />}>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400"><tr><th className="py-1">Severity</th><th>Station</th><th>Trigger</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{alerts.slice(0, 4).map(a => (
            <tr key={a.id} className="border-t border-line"><td className="py-2"><RiskBadge r={a.severity} /></td><td>{a.stationId}</td><td>{a.trigger}</td><td>{a.time}</td><td>{a.acknowledged ? 'Acknowledged' : 'Open'}</td></tr>))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
