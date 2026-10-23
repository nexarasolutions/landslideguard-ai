import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAsync } from '../hooks';
import type { Station } from '../types';
import { Async, Card, DemoBadge, RiskBadge } from '../components/ui';
import Trend from '../components/Trend';

export default function StationDetail({ station: s, back }: { station: Station; back: () => void }) {
  const rd = useAsync(() => api.readings(s.id), [s.id]);
  return (
    <div className="space-y-4">
      <button onClick={back} className="flex items-center gap-1 text-sm text-accent"><ArrowLeft size={16} />Back to live monitoring</button>
      <Card title={`${s.id} · ${s.name}`} right={<DemoBadge />}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span>Estimated risk: <RiskBadge r={s.risk} /> <b>{s.score}/100</b></span>
          <span>Battery {s.battery}%</span><span>Signal {s.signal}%</span><span>Last reading {s.lastSeenMin} min ago</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">This is a simulated estimate, not a confirmed event or a validated prediction.</p>
        {s.status !== 'online' && <p className="mt-3 flex items-center gap-2 rounded bg-yellow-400/10 p-2 text-yellow-300" role="alert"><AlertTriangle size={16} />
          {s.status === 'offline' ? 'Station is offline. Gaps in the charts mean no readings were received.' : 'Data is stale. Values may not reflect current conditions.'}</p>}
      </Card>
      <Async loading={rd.loading} error={rd.error} retry={rd.reload}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Trend title="Rainfall" unit="mm/h" data={rd.data ?? []} lines={[{ k: 'rainfall', name: 'Rainfall', c: '#60a5fa' }]} />
          <Trend title="Soil moisture" unit="%" data={rd.data ?? []} lines={[{ k: 'soil', name: 'Soil moisture', c: '#38bdf8' }]} />
          <Trend title="Ground tilt" unit="°" data={rd.data ?? []} lines={[{ k: 'tilt', name: 'Tilt', c: '#a78bfa' }]} />
          <Trend title="Vibration" unit="mm/s" data={rd.data ?? []} lines={[{ k: 'vibration', name: 'Vibration', c: '#f0abfc' }]} />
        </div>
      </Async>
    </div>
  );
}
