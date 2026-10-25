import { useEffect } from 'react';
import { Activity, Battery, MapPin, Radio, ShieldAlert, Wifi } from 'lucide-react';
import { api } from '../services/api';
import { useAsync } from '../hooks';
import type { Alert, Reading, Station } from '../types';
import { Async, Card, LiveStatusBadge, RC, RiskBadge } from '../components/ui';
import StationMap from '../components/StationMap';
import Trend from '../components/Trend';

interface Props {
  stations: Station[];
  alerts: Alert[];
  open: (id: string) => void;
}

export default function Overview({ stations, alerts, open }: Props) {
  const device: Station = stations[0] || {
    id: 'STN-001',
    name: 'LandslideGuard AI - Live Node',
    lat: 11.3164,
    lng: 77.5525,
    rainfall: 0.0,
    soil: 0.0,
    tilt: 0.0,
    vibration: 0.0,
    battery: 100,
    signal: 95,
    lastSeenMin: 0,
    status: 'online',
    score: 0,
    risk: 'Low'
  };

  const rd = useAsync(() => api.readings(device.id), [device.id], 5000);
  const readings: Reading[] = rd.data ?? [];
  const riskColor = RC[device.risk];

  return (
    <div className="space-y-4">
      {/* 6 Real-Time Telemetry KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hardware Node</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-1 text-xl font-bold text-white font-mono">{device.id}</p>
          <span className="text-[10px] text-emerald-400 capitalize">{device.status} · Active</span>
        </div>

        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>GPS Fix</span>
            <MapPin size={13} className="text-accent" />
          </div>
          <p className="mt-1 text-sm font-bold text-white font-mono">
            {device.lat.toFixed(4)}°, {device.lng.toFixed(4)}°
          </p>
          <span className="text-[10px] text-slate-400">Live Satellite Coords</span>
        </div>

        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Soil Moisture</span>
            <span className="text-xs font-semibold text-sky-400">%</span>
          </div>
          <p className="mt-1 text-xl font-bold text-sky-400">{device.soil}%</p>
          <span className="text-[10px] text-slate-400">Pore Saturation</span>
        </div>

        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Rainfall Rate</span>
            <span className="text-xs font-semibold text-blue-400">mm/h</span>
          </div>
          <p className="mt-1 text-xl font-bold text-blue-400">{device.rainfall}</p>
          <span className="text-[10px] text-slate-400">Precipitation</span>
        </div>

        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ground Tilt</span>
            <span className="text-xs font-semibold text-purple-400">°</span>
          </div>
          <p className="mt-1 text-xl font-bold text-purple-400">{device.tilt}°</p>
          <span className="text-[10px] text-slate-400">Displacement Angle</span>
        </div>

        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hazard Index</span>
            <ShieldAlert size={13} style={{ color: riskColor }} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold" style={{ color: riskColor }}>{device.risk}</span>
            <span className="text-xs text-slate-400">({device.score}/100)</span>
          </div>
          <span className="text-[10px] text-slate-400">Geotechnical Risk</span>
        </div>
      </div>

      {/* Geospatial Map + Live Hardware Status Box */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card title={`Live Location: ${device.name}`} right={<LiveStatusBadge />}>
            <StationMap stations={[device]} onSelect={open} />
          </Card>
        </div>

        <Card title="Hardware Status & Telemetry" right={<LiveStatusBadge />}>
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-navy/60 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{device.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {device.id} · ESP32 Edge Node</p>
                </div>
                <RiskBadge r={device.risk} />
              </div>

              {/* Hazard score progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Geotechnical Landslide Score</span>
                  <span className="font-semibold text-white">{device.score} / 100</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, Math.min(100, device.score))}%`, backgroundColor: riskColor }}
                  />
                </div>
              </div>
            </div>

            {/* Hardware Health Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-navy/40 p-2.5">
                <Battery size={16} className={device.battery < 25 ? 'text-red-400' : 'text-emerald-400'} />
                <div>
                  <p className="text-[10px] text-slate-400">Power Source</p>
                  <p className="font-semibold text-white">{device.battery}% Battery</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-line bg-navy/40 p-2.5">
                <Wifi size={16} className="text-sky-400" />
                <div>
                  <p className="text-[10px] text-slate-400">Signal (RSSI)</p>
                  <p className="font-semibold text-white">{device.signal}% Link</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-line bg-navy/40 p-2.5">
                <Activity size={16} className="text-pink-400" />
                <div>
                  <p className="text-[10px] text-slate-400">Vibration</p>
                  <p className="font-semibold text-white">{device.vibration} mm/s</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-line bg-navy/40 p-2.5">
                <Radio size={16} className="text-emerald-400" />
                <div>
                  <p className="text-[10px] text-slate-400">Transmission</p>
                  <p className="font-semibold text-emerald-400">
                    {device.lastSeenMin === 0 ? 'Live (0m)' : `${device.lastSeenMin}m ago`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-panel p-2.5 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Latitude:</span>
                <span className="font-mono font-semibold">{device.lat.toFixed(6)}° N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Longitude:</span>
                <span className="font-mono font-semibold">{device.lng.toFixed(6)}° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Connection Protocol:</span>
                <span className="text-accent">Supabase HTTPS REST</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 4 Real-Time Telemetry Trend Charts for this Device */}
      <Async loading={rd.loading} error={rd.error} retry={rd.reload} hasData={readings.length > 0}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Trend
            title={`Precipitation Rate · ${device.id}`}
            unit="mm/h"
            data={readings}
            lines={[{ k: 'rainfall', name: 'Rainfall', c: '#60a5fa' }]}
          />
          <Trend
            title={`Soil Moisture & Pore Saturation · ${device.id}`}
            unit="%"
            data={readings}
            lines={[{ k: 'soil', name: 'Soil Moisture', c: '#38bdf8' }]}
          />
          <Trend
            title={`Ground Tilt Displacement · ${device.id}`}
            unit="°"
            data={readings}
            lines={[{ k: 'tilt', name: 'Ground Tilt', c: '#a78bfa' }]}
          />
          <Trend
            title={`Seismic Ground Vibration · ${device.id}`}
            unit="mm/s"
            data={readings}
            lines={[{ k: 'vibration', name: 'Vibration', c: '#f0abfc' }]}
          />
        </div>
      </Async>

      {/* Real-Time Alert & Incident Feed */}
      <Card title="Live Incident & Warning Feed" right={<LiveStatusBadge />}>
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">
            No active hazard breaches detected. Sensor telemetry is within safe geotechnical limits.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-1">Severity</th>
                  <th>Device</th>
                  <th>Trigger Telemetry</th>
                  <th>Timestamp</th>
                  <th>Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 5).map(a => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="py-2.5">
                      <RiskBadge r={a.severity} />
                    </td>
                    <td className="font-mono text-xs">{a.stationId}</td>
                    <td className="text-slate-300">{a.trigger}</td>
                    <td className="text-slate-400 text-xs">{a.time}</td>
                    <td>
                      <span className={a.acknowledged ? 'text-slate-400 text-xs' : 'text-emerald-400 text-xs font-semibold'}>
                        {a.acknowledged ? 'Acknowledged' : 'Active Warning'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
