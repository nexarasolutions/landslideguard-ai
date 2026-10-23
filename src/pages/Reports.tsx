import { Printer, ShieldAlert, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import type { Station, Alert } from '../types';

interface Props {
  stations: Station[];
  alerts: Alert[];
}

export default function Reports({ stations, alerts }: Props) {
  const criticalStations = stations.filter(s => s.risk === 'Critical');
  const highStations = stations.filter(s => s.risk === 'High');
  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-accent" /> Landslide Hazard Evaluation Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated civil engineering compliance report for emergency operations, municipal authorities, and geotechnical teams.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-accent text-navy text-xs font-semibold hover:opacity-90"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div className="rounded-xl border border-line bg-panel p-6 shadow-xl space-y-6">
        {/* Report Header */}
        <div className="border-b border-line pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent font-bold text-lg">
              <ShieldAlert size={22} /> LandslideGuard AI Emergency Response Briefing
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Document Ref: LG-REP-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-01
            </div>
          </div>
          <div className="text-right text-xs text-slate-300">
            <div><strong>Date:</strong> {now}</div>
            <div><strong>Classification:</strong> Operational Safety Advisory</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Executive Summary</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The LandslideGuard AI automated telemetry grid currently monitors {stations.length} regional stations across active slope corridors.
            A total of <strong className="text-red-400">{criticalStations.length} station(s)</strong> exhibit critical geotechnical destabilization parameters,
            and <strong className="text-orange-400">{highStations.length} station(s)</strong> are classified at high risk due to elevated antecedent pore water pressures and slope creep displacement.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded border border-line bg-navy/60">
            <div className="text-slate-400">Total Monitored Nodes</div>
            <div className="text-xl font-bold text-white mt-1">{stations.length}</div>
          </div>
          <div className="p-3 rounded border border-line bg-navy/60">
            <div className="text-slate-400">Critical Priority Zones</div>
            <div className="text-xl font-bold text-red-400 mt-1">{criticalStations.length}</div>
          </div>
          <div className="p-3 rounded border border-line bg-navy/60">
            <div className="text-slate-400">Active Warning Alerts</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{alerts.filter(a => !a.acknowledged).length}</div>
          </div>
          <div className="p-3 rounded border border-line bg-navy/60">
            <div className="text-slate-400">Telemetry Health</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {Math.round((stations.filter(s => s.status === 'online').length / Math.max(1, stations.length)) * 100)}%
            </div>
          </div>
        </div>

        {/* Critical Priority Watchlist */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. High Hazard Slope Corridor Status</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-line">
              <thead className="bg-navy border-b border-line text-slate-400">
                <tr>
                  <th className="py-2 px-3">Site Identification</th>
                  <th className="py-2 px-3">Coordinates</th>
                  <th className="py-2 px-3">Moisture</th>
                  <th className="py-2 px-3">Rainfall</th>
                  <th className="py-2 px-3">Angular Tilt</th>
                  <th className="py-2 px-3">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stations.map(st => (
                  <tr key={st.id} className={st.risk === 'Critical' ? 'bg-red-500/10' : ''}>
                    <td className="py-2 px-3 font-semibold text-white">{st.name}</td>
                    <td className="py-2 px-3 text-slate-400 font-mono">{st.lat}, {st.lng}</td>
                    <td className="py-2 px-3 text-slate-300">{st.soil}%</td>
                    <td className="py-2 px-3 text-slate-300">{st.rainfall} mm/h</td>
                    <td className="py-2 px-3 text-slate-300">{st.tilt}°</td>
                    <td className="py-2 px-3"><Pill risk={st.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Field Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Civil & Emergency Recommendations</h2>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2 p-2 rounded bg-navy/50 border border-line">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
              <span><strong>Drainage Inspections:</strong> Immediate clearance of weep holes, French drains, and culverts on North Ridge slopes where saturation exceeds 80%.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-navy/50 border border-line">
              <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <span><strong>Highway Traffic Advisory:</strong> Coordinate with department of transportation regarding single-lane restrictions near Sample Site A & B escarpment.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-navy/50 border border-line">
              <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <span><strong>Hardware Maintenance:</strong> Dispatch field technician to Sample Site F to replace battery module and LoRa antenna transceiver.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
