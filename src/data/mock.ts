import type { Alert, Reading, Risk, Station } from '../types';

export const riskOf = (s: number): Risk => (s >= 75 ? 'Critical' : s >= 55 ? 'High' : s >= 30 ? 'Moderate' : 'Low');

// Operational telemetry nodes: id, name, dLat, dLng, rain, soil, tilt, vib, battery, signal, minutesAgo, status, score
const raw: [string, string, number, number, number, number, number, number, number, number, number, Station['status'], number][] = [
  ['STN-001', 'North Ridge Sector A', 0.00, 0.00, 18.2, 82, 2.4, 1.9, 78, 84, 2, 'online', 78],
  ['STN-002', 'Valley Escarpment Sector B', 0.03, 0.04, 9.5, 66, 1.1, 0.8, 91, 72, 3, 'online', 58],
  ['STN-003', 'High Slope Observatory', -0.02, 0.05, 4.1, 48, 0.5, 0.3, 64, 90, 1, 'online', 33],
  ['STN-004', 'Rail Corridor Incline Sector D', 0.05, -0.03, 1.2, 31, 0.2, 0.1, 88, 95, 4, 'online', 12],
  ['STN-005', 'Western Ghats Pass Station', -0.04, -0.04, 6.8, 55, 0.9, 0.5, 22, 41, 45, 'stale', 41],
  ['STN-006', 'Catchment Gorge Station', 0.01, -0.07, 0, 0, 0, 0, 5, 0, 190, 'offline', 0]
];

export const stations: Station[] = raw.map(([id, name, a, b, rainfall, soil, tilt, vibration, battery, signal, lastSeenMin, status, score]) => ({
  id, name, lat: +(11.4 + a).toFixed(4), lng: +(76.7 + b).toFixed(4),
  rainfall, soil, tilt, vibration, battery, signal, lastSeenMin, status, score, risk: riskOf(score)
}));

export function makeReadings(id: string): Reading[] {
  const st = stations.find(s => s.id === id) ?? stations[0];
  const k = 0.3 + (st ? st.score / 100 : 0.5);
  const seed = Number(id ? id.slice(-1) : '1') || 1;
  return Array.from({ length: 48 }, (_, i) => {
    const gap = st && st.status === 'offline' && i > 18 && i < 36;
    const h = new Date(Date.now() - (47 - i) * 3600e3).getHours();
    const w = (f: number) => Math.sin(i / 5 + seed * f);
    const r = (v: number) => (gap ? null : +v.toFixed(2));
    return {
      t: `${String(h).padStart(2, '0')}:00`,
      rainfall: r(Math.max(0, 3 + 5 * w(1)) * k * 1.6),
      soil: r(Math.min(100, 35 + 12 * w(2) + i * 0.4 * k + (st ? st.score * 0.2 : 10))),
      tilt: r(Math.max(0, 0.3 + (i / 47) * (st ? st.tilt : 0.5) + 0.1 * w(3))),
      vibration: r(Math.max(0, 0.2 + 0.5 * k * Math.abs(w(4))))
    };
  });
}

export const alerts: Alert[] = [
  { id: 'AL-101', stationId: 'STN-001', location: 'North Ridge Sector A', severity: 'Critical', time: '2 h ago', trigger: 'Soil 82 % · Rain 18.2 mm/h', description: 'Heavy precipitation with elevated subsurface pore water pressure.', acknowledged: false },
  { id: 'AL-102', stationId: 'STN-002', location: 'Valley Escarpment Sector B', severity: 'High', time: '5 h ago', trigger: 'Soil 66 % · Tilt 1.1°', description: 'Progressive slope movement detected alongside soil moisture saturation.', acknowledged: false },
  { id: 'AL-103', stationId: 'STN-005', location: 'Western Ghats Pass Station', severity: 'Moderate', time: '9 h ago', trigger: 'Data stale 45 min · Battery 22 %', description: 'Station transmission latency elevated, secondary battery reserve active.', acknowledged: true, responder: 'Field Team Alpha' },
  { id: 'AL-104', stationId: 'STN-006', location: 'Catchment Gorge Station', severity: 'Moderate', time: '1 d ago', trigger: 'No reading for 190 min', description: 'Hardware telemetry offline. Scheduled for on-site diagnostic inspection.', acknowledged: false }
];
