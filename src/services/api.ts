// LandslideGuard AI Full API Service Layer
import type {
  Alert, Reading, Station, User, AuthResponse,
  ScenarioRequest, ScenarioResponse, AnalyticsSummary, SystemSettings
} from '../types';
import { alerts as mockAlerts, makeReadings, stations as mockStations, riskOf } from '../data/mock';

let cachedToken: string | null = localStorage.getItem('lg_auth_token');
let currentUser: User | null = JSON.parse(localStorage.getItem('lg_auth_user') || 'null');

export function getStoredUser(): User | null {
  return currentUser;
}

export function setStoredSession(token: string | null, user: User | null) {
  cachedToken = token;
  currentUser = user;
  if (token && user) {
    localStorage.setItem('lg_auth_token', token);
    localStorage.setItem('lg_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('lg_auth_token');
    localStorage.removeItem('lg_auth_user');
  }
}

// Default base url from env or relative / proxy
const BASE: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
export const IS_DEMO = !BASE;

const wait = <T,>(v: T, ms = 300) => new Promise<T>(r => setTimeout(() => r(v), ms));

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {})
  };

  if (cachedToken) {
    headers['Authorization'] = `Bearer ${cachedToken}`;
  }

  try {
    const res = await fetch(`${BASE}${path}`, { ...init, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.detail || `API error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    // If network fails to connect to backend, throw so caller can fallback to demo if appropriate
    throw err;
  }
}

// In-memory demo state storage
let demoStations = [...mockStations];
let demoAlerts = [...mockAlerts];
let demoSettings: SystemSettings = {
  rainfall_threshold_high_mm: 60.0,
  rainfall_threshold_crit_mm: 100.0,
  soil_moisture_threshold_pct: 80.0,
  tilt_threshold_deg: 5.0,
  vibration_threshold_mms: 12.0,
  alert_email_enabled: true,
  alert_sms_enabled: false,
  auto_refresh_seconds: 30
};

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    if (BASE) {
      try {
        const res = await http<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        setStoredSession(res.access_token, res.user);
        return res;
      } catch (e) {
        console.warn('Backend login failed, checking demo fallback', e);
      }
    }
    // Demo fallback login
    const demoUser: User = {
      id: 'usr-demo-001',
      email: email || 'engineer@landslideguard.ai',
      name: email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Sarah Chen',
      role: 'Field Engineer'
    };
    const res: AuthResponse = {
      access_token: 'demo-jwt-token-active',
      token_type: 'bearer',
      user: demoUser
    };
    setStoredSession(res.access_token, demoUser);
    return wait(res, 200);
  },

  register: async (name: string, email: string, password: string, role: User['role']): Promise<AuthResponse> => {
    if (BASE) {
      try {
        const res = await http<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role })
        });
        setStoredSession(res.access_token, res.user);
        return res;
      } catch (e) {
        console.warn('Backend register failed, using demo fallback', e);
      }
    }
    const demoUser: User = { id: `usr-${Date.now()}`, email, name, role };
    const res: AuthResponse = { access_token: 'demo-jwt-registered', token_type: 'bearer', user: demoUser };
    setStoredSession(res.access_token, demoUser);
    return wait(res, 200);
  },

  me: async (): Promise<User> => {
    if (BASE && cachedToken) {
      try {
        return await http<User>('/api/auth/me');
      } catch (e) {
        // fallback
      }
    }
    return currentUser || {
      id: 'usr-demo-001',
      email: 'engineer@landslideguard.ai',
      name: 'Sarah Chen',
      role: 'Field Engineer'
    };
  },

  logout: () => {
    setStoredSession(null, null);
  },

  // Stations
  stations: async (): Promise<Station[]> => {
    if (BASE) {
      try {
        return await http<Station[]>('/api/stations');
      } catch (e) {
        console.warn('Backend unreachable, using demo stations', e);
      }
    }
    return wait(demoStations);
  },

  station: async (id: string): Promise<Station> => {
    if (BASE) {
      try {
        return await http<Station>(`/api/stations/${id}`);
      } catch (e) {
        // fallback
      }
    }
    const s = demoStations.find(x => x.id === id) ?? demoStations[0];
    return wait(s);
  },

  createStation: async (st: Partial<Station>): Promise<Station> => {
    if (BASE) {
      try {
        return await http<Station>('/api/stations', {
          method: 'POST',
          body: JSON.stringify(st)
        });
      } catch (e) {
        console.warn('Backend create station failed, updating demo store', e);
      }
    }
    const score = st.score ?? 25;
    const newStation: Station = {
      id: st.id || `SITE-00${demoStations.length + 1}`,
      name: st.name || 'New Monitoring Station',
      lat: st.lat ?? 11.42,
      lng: st.lng ?? 76.71,
      rainfall: st.rainfall ?? 0,
      soil: st.soil ?? 30,
      tilt: st.tilt ?? 0.1,
      vibration: st.vibration ?? 0.05,
      battery: st.battery ?? 100,
      signal: st.signal ?? 95,
      lastSeenMin: 0,
      status: 'online',
      score,
      risk: riskOf(score)
    };
    demoStations = [newStation, ...demoStations];
    return wait(newStation);
  },

  calibrateStation: async (id: string): Promise<Station> => {
    if (BASE) {
      try {
        return await http<Station>(`/api/stations/${id}/calibrate`, { method: 'POST' });
      } catch (e) {
        console.warn('Backend calibrate failed, updating demo station', e);
      }
    }
    const st = demoStations.find(s => s.id === id);
    if (st) {
      st.tilt = 0.0;
      st.vibration = 0.05;
      st.status = 'online';
      st.lastSeenMin = 0;
      st.score = Math.max(5, Math.round(st.score * 0.7));
      st.risk = riskOf(st.score);
      return wait({ ...st });
    }
    throw new Error('Station not found');
  },

  readings: async (id: string): Promise<Reading[]> => {
    if (BASE) {
      try {
        return await http<Reading[]>(`/api/stations/${id}/readings`);
      } catch (e) {
        console.warn('Backend readings failed, using mock readings', e);
      }
    }
    return wait(makeReadings(id));
  },

  // Alerts
  alerts: async (): Promise<Alert[]> => {
    if (BASE) {
      try {
        return await http<Alert[]>('/api/alerts');
      } catch (e) {
        console.warn('Backend alerts failed, using demo alerts', e);
      }
    }
    return wait(demoAlerts.map(a => ({ ...a })));
  },

  acknowledge: async (id: string, responder = 'Control Room'): Promise<void> => {
    if (BASE) {
      try {
        await http(`/api/alerts/${id}/acknowledge`, {
          method: 'POST',
          body: JSON.stringify({ responder })
        });
        return;
      } catch (e) {
        console.warn('Backend acknowledge failed, updating demo alert', e);
      }
    }
    const a = demoAlerts.find(x => x.id === id);
    if (a) {
      a.acknowledged = true;
      a.responder = responder;
    }
    return wait(undefined);
  },

  simulateAlert: async (data: { stationId: string; severity: Alert['severity']; trigger: string; description: string }): Promise<Alert> => {
    if (BASE) {
      try {
        return await http<Alert>('/api/alerts/simulate', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      } catch (e) {
        console.warn('Backend alert simulation failed, creating demo alert', e);
      }
    }
    const loc = demoStations.find(s => s.id === data.stationId)?.name || 'Custom Site';
    const alert: Alert = {
      id: `AL-${demoAlerts.length + 101}`,
      stationId: data.stationId,
      location: loc,
      severity: data.severity,
      time: 'Just now',
      trigger: data.trigger,
      description: data.description,
      acknowledged: false
    };
    demoAlerts = [alert, ...demoAlerts];
    return wait(alert);
  },

  // AI Geotechnical Prediction
  simulateScenario: async (req: ScenarioRequest): Promise<ScenarioResponse> => {
    if (BASE) {
      try {
        return await http<ScenarioResponse>('/api/prediction/simulate', {
          method: 'POST',
          body: JSON.stringify(req)
        });
      } catch (e) {
        console.warn('Backend prediction simulation failed, using local model', e);
      }
    }
    // Local AI physics proxy
    const slopeRad = (req.slope_angle_deg * Math.PI) / 180;
    const porePressure = req.soil_saturation_pct * 0.45 * (req.rainfall_intensity_mm / 50.0);
    const drainageFactor = Math.max(0.1, 1.0 - req.drainage_capacity_pct / 100.0);
    const effectivePoreKpa = +(porePressure * drainageFactor * 12.5).toFixed(1);

    const driving = Math.sin(slopeRad) * 1.5 + (req.rainfall_intensity_mm / 100.0) * 0.8;
    const resisting = Math.cos(slopeRad) * (1.8 - (req.soil_saturation_pct / 100.0) * 0.9);
    const fos = +Math.max(0.4, Math.min(3.0, (resisting / Math.max(0.1, driving)) * (1.0 + req.drainage_capacity_pct / 200.0))).toFixed(2);

    const rawScore = Math.max(0, Math.min(100, Math.round((2.2 - fos) * 50 + effectivePoreKpa / 1.5)));
    const riskLevel = riskOf(rawScore);

    let timeToCritical: number | null = null;
    let statement = '';
    if (fos < 1.0) {
      timeToCritical = +Math.max(0.5, 4.0 - req.rainfall_intensity_mm / 25.0).toFixed(1);
      statement = `CRITICAL SLOPE INSTABILITY: Factor of Safety (${fos}) is under failure limit. Immediate downslope hazard warnings required.`;
    } else if (fos < 1.3) {
      timeToCritical = +Math.max(2.0, 12.0 - req.rainfall_intensity_mm / 15.0).toFixed(1);
      statement = `HIGH HAZARD ADVISORY: Effective pore pressure (${effectivePoreKpa} kPa) reducing frictional shear resistance.`;
    } else {
      statement = `EQUILIBRIUM MAINTAINED: Slope stability factor (${fos}) indicates safe structural margin under modeled parameters.`;
    }

    return wait({
      projected_risk_score: rawScore,
      projected_risk_level: riskLevel,
      pore_water_pressure_kpa: effectivePoreKpa,
      factor_of_safety: fos,
      time_to_critical_hours: timeToCritical,
      warning_statement: statement,
      factors: [
        { factor: 'Rainfall Intensity', impact: req.rainfall_intensity_mm > 50 ? 'High' : 'Moderate', weight: 35 },
        { factor: 'Soil Moisture Saturation', impact: req.soil_saturation_pct > 80 ? 'Critical' : 'Moderate', weight: 30 },
        { factor: 'Slope Gradient', impact: req.slope_angle_deg > 35 ? 'High' : 'Low', weight: 20 },
        { factor: 'Drainage Relief Capacity', impact: req.drainage_capacity_pct > 50 ? 'Protective' : 'Deficit', weight: 15 }
      ]
    });
  },

  // Analytics
  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    if (BASE) {
      try {
        return await http<AnalyticsSummary>('/api/analytics/summary');
      } catch (e) {
        // fallback
      }
    }
    const total = demoStations.length;
    return wait({
      total_stations: total,
      critical_count: demoStations.filter(s => s.risk === 'Critical').length,
      high_count: demoStations.filter(s => s.risk === 'High').length,
      online_count: demoStations.filter(s => s.status === 'online').length,
      stale_count: demoStations.filter(s => s.status === 'stale').length,
      offline_count: demoStations.filter(s => s.status === 'offline').length,
      average_soil_saturation_pct: +(demoStations.reduce((a, b) => a + b.soil, 0) / Math.max(1, total)).toFixed(1),
      peak_rainfall_rate_mm: +(Math.max(...demoStations.map(s => s.rainfall), 0)).toFixed(1),
      total_alerts: demoAlerts.length,
      unacknowledged_alerts: demoAlerts.filter(a => !a.acknowledged).length
    });
  },

  // Settings
  getSettings: async (): Promise<SystemSettings> => {
    if (BASE) {
      try {
        return await http<SystemSettings>('/api/settings');
      } catch (e) {
        // fallback
      }
    }
    return wait({ ...demoSettings });
  },

  updateSettings: async (settings: SystemSettings): Promise<SystemSettings> => {
    if (BASE) {
      try {
        return await http<SystemSettings>('/api/settings', {
          method: 'PUT',
          body: JSON.stringify(settings)
        });
      } catch (e) {
        // fallback
      }
    }
    demoSettings = { ...settings };
    return wait({ ...demoSettings });
  }
};
