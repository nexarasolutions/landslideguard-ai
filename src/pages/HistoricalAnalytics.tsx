import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Activity, TrendingUp, AlertOctagon } from 'lucide-react';
import { Card } from '../components/ui';
import Trend from '../components/Trend';
import { api } from '../services/api';
import type { Station, Reading, AnalyticsSummary } from '../types';

interface Props {
  stations: Station[];
}

export default function HistoricalAnalytics({ stations }: Props) {
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || 'STN-001');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getAnalyticsSummary().then(setSummary).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      setLoading(true);
      api.readings(selectedStationId)
        .then(data => setReadings(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedStationId]);

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];

  const handleExportCsv = () => {
    // Generate CSV client-side / download
    const headers = 'Timestamp,Rainfall_mm_h,Soil_Moisture_pct,Tilt_deg,Vibration_mms\n';
    const rows = readings.map(r => `${r.t},${r.rainfall ?? ''},${r.soil ?? ''},${r.tilt ?? ''},${r.vibration ?? ''}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedStation?.id || 'telemetry'}_historical_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-accent" /> Historical Analytics & Long-Term Trends
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analyze time-series sensor degradation, antecedent moisture trends, and export certified geotechnical CSV datasets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-accent text-navy text-xs font-semibold hover:opacity-90"
          >
            <Download size={14} /> Export Telemetry CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" /> Network Stations
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {summary.online_count} <span className="text-xs font-normal text-slate-400">/ {summary.total_stations} online</span>
            </div>
          </Card>

          <Card>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-sky-400" /> Avg Soil Saturation
            </div>
            <div className="text-2xl font-bold text-sky-400 mt-1">
              {summary.average_soil_saturation_pct}%
            </div>
          </Card>

          <Card>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity size={14} className="text-accent" /> Peak 24h Rain Rate
            </div>
            <div className="text-2xl font-bold text-accent mt-1">
              {summary.peak_rainfall_rate_mm} <span className="text-xs font-normal text-slate-400">mm/h</span>
            </div>
          </Card>

          <Card>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertOctagon size={14} className="text-red-400" /> Critical Incidents
            </div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {summary.critical_count}
            </div>
          </Card>
        </div>
      )}

      {/* Station & Time Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-line bg-panel">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Select Site:</span>
          <select
            value={selectedStationId}
            onChange={e => setSelectedStationId(e.target.value)}
            className="rounded border border-line bg-navy px-3 py-1 text-xs text-white outline-none"
          >
            {stations.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Calendar size={14} className="text-slate-400" />
          {(['24h', '7d', '30d'] as const).map(tr => (
            <button
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-2.5 py-1 rounded border transition ${
                timeRange === tr
                  ? 'bg-accent/20 border-accent text-accent font-semibold'
                  : 'bg-navy border-line text-slate-400 hover:text-white'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Telemetry Charts */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading historical telemetry curves...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Trend
            title="Precipitation Intensity History"
            unit="mm/h"
            data={readings}
            lines={[{ k: 'rainfall', name: 'Rainfall', c: '#38bdf8' }]}
          />

          <Trend
            title="Pore Water & Soil Saturation Index"
            unit="%"
            data={readings}
            lines={[{ k: 'soil', name: 'Soil Moisture', c: '#34d399' }]}
          />

          <Trend
            title="Slope Displacement & Tilt Sensor"
            unit="°"
            data={readings}
            lines={[{ k: 'tilt', name: 'Ground Tilt', c: '#fbbf24' }]}
          />

          <Trend
            title="Seismic & Ground Vibration"
            unit="mm/s"
            data={readings}
            lines={[{ k: 'vibration', name: 'Vibration', c: '#f87171' }]}
          />
        </div>
      )}
    </div>
  );
}
