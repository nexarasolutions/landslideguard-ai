import { useState, useEffect } from 'react';
import { Settings, Save, Server, Bell, Shield, CheckCircle2, Activity, Globe, Database } from 'lucide-react';
import { Card } from '../components/ui';
import { api, IS_DEMO } from '../services/api';
import type { SystemSettings } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    rainfall_threshold_high_mm: 60,
    rainfall_threshold_crit_mm: 100,
    soil_moisture_threshold_pct: 80,
    tilt_threshold_deg: 5.0,
    vibration_threshold_mms: 12.0,
    alert_email_enabled: true,
    alert_sms_enabled: false,
    auto_refresh_seconds: 30
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkBackend = async () => {
    setBackendStatus('Pinging backend...');
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setBackendStatus('Connected: Backend is Healthy (200 OK)');
      } else {
        setBackendStatus(`Response status: ${res.status}`);
      }
    } catch {
      setBackendStatus('Backend unreachable, using local fallback state');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="text-accent" /> System Configuration & Sensor Thresholds
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure early-warning alert limits, notification dispatch rules, and API deployment links.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Geotechnical Hazard Thresholds */}
          <Card title="Geotechnical Hazard Trigger Limits">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">
                  High Risk Rainfall Threshold (mm/h)
                </label>
                <input
                  type="number"
                  value={settings.rainfall_threshold_high_mm}
                  onChange={e => setSettings({ ...settings, rainfall_threshold_high_mm: +e.target.value })}
                  className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Critical Risk Rainfall Threshold (mm/h)
                </label>
                <input
                  type="number"
                  value={settings.rainfall_threshold_crit_mm}
                  onChange={e => setSettings({ ...settings, rainfall_threshold_crit_mm: +e.target.value })}
                  className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Critical Soil Moisture Saturation (%)
                </label>
                <input
                  type="number"
                  value={settings.soil_moisture_threshold_pct}
                  onChange={e => setSettings({ ...settings, soil_moisture_threshold_pct: +e.target.value })}
                  className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tilt Limit (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.tilt_threshold_deg}
                    onChange={e => setSettings({ ...settings, tilt_threshold_deg: +e.target.value })}
                    className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Vibration Limit (mm/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.vibration_threshold_mms}
                    onChange={e => setSettings({ ...settings, vibration_threshold_mms: +e.target.value })}
                    className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Alerting Rules & Deployment Bridge */}
          <div className="space-y-6">
            <Card title="Emergency Dispatch & Notification Rules">
              <div className="space-y-4 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.alert_email_enabled}
                    onChange={e => setSettings({ ...settings, alert_email_enabled: e.target.checked })}
                    className="accent-accent h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-white font-medium block">Automated Email Incident Dispatch</span>
                    <span className="text-slate-400 text-[11px]">Send immediate telemetry alerts to field engineering teams.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.alert_sms_enabled}
                    onChange={e => setSettings({ ...settings, alert_sms_enabled: e.target.checked })}
                    className="accent-accent h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-white font-medium block">Cellular SMS Emergency Broadcast</span>
                    <span className="text-slate-400 text-[11px]">Push immediate flash SMS warnings on Critical breaches.</span>
                  </div>
                </label>
              </div>
            </Card>

            <Card title="Database & Cloud Infrastructure">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2">
                    <Database size={14} className="text-accent" /> Database Engine:
                  </span>
                  <span className="font-semibold text-emerald-400">
                    Supabase PostgreSQL 15+
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Tables configured: <code className="text-accent">stations</code>, <code className="text-accent">readings</code>, <code className="text-accent">alerts</code>, <code className="text-accent">users</code>, <code className="text-accent">system_settings</code>
                </div>
              </div>
            </Card>

            <Card title="Deployment & API Connection Status">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2">
                    <Globe size={14} className="text-accent" /> Mode:
                  </span>
                  <span className={`font-semibold ${IS_DEMO ? 'text-accent' : 'text-emerald-400'}`}>
                    {IS_DEMO ? 'Production Telemetry Grid (Local Edge)' : 'Connected to Render Backend'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-navy border border-line font-mono text-[11px] text-slate-300">
                  VITE_API_URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={checkBackend}
                    className="px-3 py-1.5 rounded border border-line bg-panel text-slate-300 hover:text-white"
                  >
                    Test Backend Connectivity
                  </button>
                  {backendStatus && (
                    <span className="text-[11px] text-slate-300">{backendStatus}</span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={16} /> System settings updated successfully!
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded bg-accent text-navy font-semibold hover:opacity-90 transition text-xs"
            >
              <Save size={16} /> {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
