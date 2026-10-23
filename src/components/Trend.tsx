import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, DemoBadge } from './ui';

export interface Series { k: string; name: string; c: string }
// connectNulls=false: missing readings show as gaps instead of misleading continuous lines.
export default function Trend({ title, unit, data, lines }: { title: string; unit: string; data: object[]; lines: Series[] }) {
  return (
    <Card title={`${title} (${unit})`} right={<DemoBadge />}>
      <div className="h-56" role="img" aria-label={`${title} chart in ${unit}`}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: 0, right: 8, top: 4 }}>
            <CartesianGrid stroke="#243049" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#94a3b8" fontSize={11} interval={7} />
            <YAxis stroke="#94a3b8" fontSize={11} width={44} label={{ value: unit, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#0B1220', border: '1px solid #243049', color: '#e2e8f0' }}
              formatter={(v: unknown) => (v == null ? 'No reading' : `${v} ${unit}`)} />
            <Legend />
            {lines.map(l => <Line key={l.k} dataKey={l.k} name={l.name} stroke={l.c} strokeWidth={2} dot={false} connectNulls={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
