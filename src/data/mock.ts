// ALL VALUES HERE ARE SIMULATED (DEMO DATA). Coordinates are arbitrary sample points, not real sensor sites.
import type { Alert, Reading, Risk, Station } from '../types';

export const riskOf = (s: number): Risk => (s >= 75 ? 'Critical' : s >= 55 ? 'High' : s >= 30 ? 'Moderate' : 'Low');

// id, name, dLat, dLng, rain, soil, tilt, vib, battery, signal, minutesAgo, status, score
const raw: [string, string, number, number, number, number, number, number, number, number, number, Station['status'], number][] = [
  ['DEMO-001', 'Sample Site A', 0.00, 0.00, 18.2, 82, 2.4, 1.9, 78, 84, 2, 'online', 78],
  ['DEMO-002', 'Sample Site B', 0.03, 0.04, 9.5, 66, 1.1, 0.8, 91, 72, 3, 'online', 58],
  ['DEMO-003', 'Sample Site C', -0.02, 0.05, 4.1, 48, 0.5, 0.3, 64, 90, 1, 'online', 33],
  ['DEMO-004', 'Sample Site D', 0.05, -0.03, 1.2, 31, 0.2, 0.1, 88, 95, 4, 'online', 12],
  ['DEMO-005', 'Sample Site E', -0.04, -0.04, 6.8, 55, 0.9, 0.5, 22, 41, 45, 'stale', 41],
  ['DEMO-006', 'Sample Site F', 0.01, -0.07, 0, 0, 0, 0, 5, 0, 190, 'offline', 0]
];

export const stations: Station[] = raw.map(([id, name, a, b, rainfall, soil, tilt, vibration, battery, signal, lastSeenMin, status, score]) => ({
  id, name, lat: +(11.4 + a).toFixed(4), lng: +(76.7 + b).toFixed(4),
  rainfall, soil, tilt, vibration, battery, signal, lastSeenMin, status, score, risk: riskOf(score)
}));

export function makeReadings(id: string): Reading[] {
  const st = stations.find(s => s.id === id) ?? stations[0];
  const k = 0.3 + st.score / 100;
  const seed = Number(id.slice(-1));
  return Array.from({ length: 48 }, (_, i) => {
    const gap = st.status === 'offline' && i > 18 && i < 36; // missing data -> visible gap, not a fake line
    const h = new Date(Date.now() - (47 - i) * 3600e3).getHours();
    const w = (f: number) => Math.sin(i / 5 + seed * f);
    const r = (v: number) => (gap ? null : +v.toFixed(2));
    return {
      t: `${String(h).padStart(2, '0')}:00`,
      rainfall: r(Math.max(0, 3 + 5 * w(1)) * k * 1.6),
      soil: r(Math.min(100, 35 + 12 * w(2) + i * 0.4 * k + st.score * 0.2)),
      tilt: r(Math.max(0, 0.3 + (i / 47) * st.tilt + 0.1 * w(3))),
      vibration: r(Math.max(0, 0.2 + 0.5 * k * Math.abs(w(4))))
    };
  });
}

export const alerts: Alert[] = [
  { id: 'AL-101', stationId: 'DEMO-001', location: 'Sample Site A', severity: 'Critical', time: '2 h ago', trigger: 'Soil 82 % · Rain 18.2 mm/h', description: 'Simulated threshold breach: sustained rainfall with near-saturated soil.', acknowledged: false },
  { id: 'AL-102', stationId: 'DEMO-002', location: 'Sample Site B', severity: 'High', time: '5 h ago', trigger: 'Soil 66 % · Tilt 1.1°', description: 'Simulated rise in soil moisture and ground tilt.', acknowledged: false },
  { id: 'AL-103', stationId: 'DEMO-005', location: 'Sample Site E', severity: 'Moderate', time: '9 h ago', trigger: 'Data stale 45 min · Battery 22 %', description: 'Station reporting late with low battery.', acknowledged: true, responder: 'Field team 2' },
  { id: 'AL-104', stationId: 'DEMO-006', location: 'Sample Site F', severity: 'Moderate', time: '1 d ago', trigger: 'No reading for 190 min', description: 'Station offline. Risk estimate unavailable.', acknowledged: false }
];
