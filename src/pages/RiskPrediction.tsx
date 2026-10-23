import { useState, useEffect } from 'react';
import { BrainCircuit, CloudRain, Mountain, ShieldAlert, Sparkles, Timer, Activity, Play } from 'lucide-react';
import { Card } from '../components/ui';
import { api } from '../services/api';
import type { ScenarioRequest, ScenarioResponse } from '../types';

const PRESETS = [
  { name: 'Monsoon Torrential', rain: 110, duration: 8, soil: 88, slope: 42, drainage: 20 },
  { name: 'Tropical Depression', rain: 65, duration: 12, soil: 75, slope: 35, drainage: 45 },
  { name: 'Prolonged Drizzle', rain: 20, duration: 48, soil: 65, slope: 30, drainage: 60 },
  { name: 'Clear Baseline', rain: 2, duration: 24, soil: 25, slope: 25, drainage: 85 }
];

export default function RiskPrediction() {
  const [params, setParams] = useState<ScenarioRequest>({
    rainfall_intensity_mm: 75,
    storm_duration_hours: 6,
    soil_saturation_pct: 80,
    slope_angle_deg: 36,
    drainage_capacity_pct: 35
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResponse | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.simulateScenario(params);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const riskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Moderate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-accent" /> AI Geotechnical Risk Prediction Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate storm rainfall, pore water pressure buildup, and slope factor of safety using physics-informed neural calculations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => {
                setParams({
                  rainfall_intensity_mm: p.rain,
                  storm_duration_hours: p.duration,
                  soil_saturation_pct: p.soil,
                  slope_angle_deg: p.slope,
                  drainage_capacity_pct: p.drainage
                });
              }}
              className="text-xs px-2.5 py-1 rounded bg-panel border border-line text-slate-300 hover:border-accent hover:text-white transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Storm & Geologic Parameters">
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Rainfall Rate:</span>
                  <span className="font-semibold text-accent">{params.rainfall_intensity_mm} mm/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={params.rainfall_intensity_mm}
                  onChange={e => setParams({ ...params, rainfall_intensity_mm: +e.target.value })}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Storm Duration:</span>
                  <span className="font-semibold text-accent">{params.storm_duration_hours} hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="72"
                  value={params.storm_duration_hours}
                  onChange={e => setParams({ ...params, storm_duration_hours: +e.target.value })}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Antecedent Soil Saturation:</span>
                  <span className="font-semibold text-accent">{params.soil_saturation_pct} %</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={params.soil_saturation_pct}
                  onChange={e => setParams({ ...params, soil_saturation_pct: +e.target.value })}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Slope Incline Angle:</span>
                  <span className="font-semibold text-accent">{params.slope_angle_deg}°</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={params.slope_angle_deg}
                  onChange={e => setParams({ ...params, slope_angle_deg: +e.target.value })}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Subsurface Drainage Capacity:</span>
                  <span className="font-semibold text-accent">{params.drainage_capacity_pct} %</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={params.drainage_capacity_pct}
                  onChange={e => setParams({ ...params, drainage_capacity_pct: +e.target.value })}
                  className="w-full accent-accent"
                />
              </div>

              <button
                onClick={runSimulation}
                disabled={loading}
                className="w-full py-2 px-4 rounded bg-accent text-navy font-semibold hover:opacity-90 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Activity className="animate-spin" size={16} /> : <Play size={16} />}
                {loading ? 'Calculating...' : 'Run Scenario Model'}
              </button>
            </div>
          </Card>
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Alert Statement Box */}
              <div className={`p-4 rounded-lg border ${riskBadgeColor(result.projected_risk_level)} flex items-start gap-3`}>
                <ShieldAlert className="mt-0.5 shrink-0" size={20} />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>Hazard Projection: {result.projected_risk_level.toUpperCase()}</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-current font-semibold">
                      Score: {result.projected_risk_score} / 100
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-200">{result.warning_statement}</p>
                </div>
              </div>

              {/* Geotechnical KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Mountain size={14} /> Factor of Safety (FoS)
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${result.factor_of_safety < 1.0 ? 'text-red-400' : result.factor_of_safety < 1.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {result.factor_of_safety}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {result.factor_of_safety < 1.0 ? 'Critical: Failure expected' : result.factor_of_safety < 1.3 ? 'Marginal stability' : 'Stable equilibrium (≥ 1.3)'}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <CloudRain size={14} /> Pore Water Pressure
                  </div>
                  <div className="text-2xl font-bold mt-1 text-sky-400">
                    {result.pore_water_pressure_kpa} <span className="text-sm font-normal text-slate-400">kPa</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Subsurface hydrostatic shear stress
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Timer size={14} /> Estimated Time to Failure
                  </div>
                  <div className="text-2xl font-bold mt-1 text-purple-400">
                    {result.time_to_critical_hours !== null ? `${result.time_to_critical_hours} hrs` : 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {result.time_to_critical_hours ? 'Lead-time before breach' : 'No imminent trigger'}
                  </div>
                </Card>
              </div>

              {/* Risk Factor Breakdown */}
              <Card title="Contributing Factors & Sensitivity Matrix">
                <div className="space-y-3 mt-2 text-xs">
                  {result.factors.map(f => (
                    <div key={f.factor} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span className="font-medium">{f.factor}</span>
                        <span className={`font-semibold ${
                          f.impact === 'Critical' ? 'text-red-400' :
                          f.impact === 'High' ? 'text-orange-400' :
                          f.impact === 'Protective' ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          {f.impact} ({f.weight}%)
                        </span>
                      </div>
                      <div className="w-full bg-navy h-2 rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            f.impact === 'Critical' ? 'bg-red-500' :
                            f.impact === 'High' ? 'bg-orange-500' :
                            f.impact === 'Protective' ? 'bg-emerald-500' : 'bg-accent'
                          }`}
                          style={{ width: `${f.weight * 2.5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">Loading AI model...</div>
          )}
        </div>
      </div>
    </div>
  );
}
