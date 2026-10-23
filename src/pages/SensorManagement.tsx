import { useState } from 'react';
import { Radio, Plus, RefreshCw, Battery, Wifi, CheckCircle2, AlertTriangle, XCircle, Sliders } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import { api } from '../services/api';
import type { Station } from '../types';

interface Props {
  stations: Station[];
  reload: () => void;
  openDetail: (id: string) => void;
}

export default function SensorManagement({ stations, reload, openDetail }: Props) {
  const [filter, setFilter] = useState<'all' | 'online' | 'stale' | 'offline'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [calibrating, setCalibrating] = useState<string | null>(null);
  const [pinging, setPinging] = useState<string | null>(null);

  // New station form state
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState('11.4150');
  const [newLng, setNewLng] = useState('76.7150');
  const [newSoil, setNewSoil] = useState('45');
  const [newRain, setNewRain] = useState('5.0');

  const filtered = stations.filter(s => filter === 'all' || s.status === filter);

  const handleCalibrate = async (id: string) => {
    setCalibrating(id);
    try {
      await api.calibrateStation(id);
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setCalibrating(null);
    }
  };

  const handlePing = (id: string) => {
    setPinging(id);
    setTimeout(() => {
      setPinging(null);
    }, 800);
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createStation({
        name: newName,
        lat: parseFloat(newLat) || 11.42,
        lng: parseFloat(newLng) || 76.71,
        soil: parseFloat(newSoil) || 30,
        rainfall: parseFloat(newRain) || 0,
        tilt: 0.1,
        vibration: 0.05,
        battery: 100,
        signal: 95,
        status: 'online',
        score: Math.min(100, Math.round((parseFloat(newSoil) || 30) * 0.6 + (parseFloat(newRain) || 0) * 1.5))
      });
      setShowAddModal(false);
      setNewName('');
      reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="text-accent" /> Sensor Network & Hardware Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Telemetry hardware diagnostics, field recalibration, battery telemetry, and deployment of IoT monitoring stations.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-panel border border-line text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw size={14} /> Refresh Hardware
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent text-navy text-xs font-semibold hover:opacity-90"
          >
            <Plus size={14} /> Deploy New Station
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs">
        {(['all', 'online', 'stale', 'offline'] as const).map(k => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg border capitalize transition ${
              filter === k
                ? 'bg-accent/15 border-accent text-accent font-semibold'
                : 'bg-panel border-line text-slate-400 hover:text-slate-200'
            }`}
          >
            {k} ({k === 'all' ? stations.length : stations.filter(s => s.status === k).length})
          </button>
        ))}
      </div>

      {/* Hardware Table */}
      <Card title="Station Fleet & Telemetry Health">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-slate-400">
                <th className="py-2.5 px-3">Station Node</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Battery & Signal</th>
                <th className="py-2.5 px-3">Sensor Metrics</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(st => (
                <tr key={st.id} className="hover:bg-navy/40 transition">
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openDetail(st.id)}
                      className="text-left font-semibold text-white hover:text-accent"
                    >
                      {st.name}
                    </button>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {st.id} · {st.lat.toFixed(4)}, {st.lng.toFixed(4)}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 capitalize text-xs">
                      {st.status === 'online' && <CheckCircle2 size={14} className="text-emerald-400" />}
                      {st.status === 'stale' && <AlertTriangle size={14} className="text-amber-400" />}
                      {st.status === 'offline' && <XCircle size={14} className="text-red-400" />}
                      <span className={st.status === 'online' ? 'text-emerald-400' : st.status === 'stale' ? 'text-amber-400' : 'text-red-400'}>
                        {st.status}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {st.lastSeenMin === 0 ? 'Active' : `${st.lastSeenMin}m ago`}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Battery size={13} className={st.battery < 30 ? 'text-red-400' : 'text-emerald-400'} />
                        <span>{st.battery}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Wifi size={13} className="text-sky-400" />
                        <span>{st.signal}% RSSI</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-300 space-y-0.5">
                      <div>Rain: <span className="font-mono text-white">{st.rainfall}</span> mm/h</div>
                      <div>Moisture: <span className="font-mono text-white">{st.soil}</span>%</div>
                      <div>Tilt: <span className="font-mono text-white">{st.tilt}</span>°</div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <Pill risk={st.risk} />
                    <div className="text-[10px] text-slate-400 mt-1">Score: {st.score}/100</div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handlePing(st.id)}
                        disabled={pinging === st.id}
                        className="px-2 py-1 rounded border border-line bg-panel text-[11px] text-slate-300 hover:text-white hover:border-slate-400"
                        title="Ping IoT LoRa Gateway"
                      >
                        {pinging === st.id ? 'Pinging...' : 'Ping'}
                      </button>
                      <button
                        onClick={() => handleCalibrate(st.id)}
                        disabled={calibrating === st.id}
                        className="px-2 py-1 rounded border border-accent/40 bg-accent/10 text-[11px] text-accent hover:bg-accent/20 flex items-center gap-1"
                        title="Reset Accelerometer & Zero Offset"
                      >
                        <Sliders size={12} />
                        {calibrating === st.id ? 'Calibrating...' : 'Zero Cal'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Deploy Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Plus className="text-accent" /> Register New Monitoring Node
            </h2>
            <form onSubmit={handleCreateStation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Site / Station Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ridge Escarpment Alpha"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLat}
                    onChange={e => setNewLat(e.target.value)}
                    className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLng}
                    onChange={e => setNewLng(e.target.value)}
                    className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Initial Soil Saturation (%)</label>
                  <input
                    type="number"
                    value={newSoil}
                    onChange={e => setNewSoil(e.target.value)}
                    className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Rainfall Rate (mm/h)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRain}
                    onChange={e => setNewRain(e.target.value)}
                    className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-line bg-navy text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-accent text-navy font-semibold hover:opacity-90"
                >
                  Deploy Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
