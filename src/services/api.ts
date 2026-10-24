import type {
  Station, Reading, Alert, AuthResponse, User,
  ScenarioRequest, ScenarioResponse, SystemSettings, AnalyticsSummary
} from '../types';
import { stations as initialStations, alerts as initialAlerts, makeReadings, riskOf } from '../data/mock';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

let cachedToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('lg_auth_token') : null;
let currentUser: User | null = typeof window !== 'undefined' ? (() => {
  try {
    const raw = localStorage.getItem('lg_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})() : null;

export const setStoredSession = (token: string | null, user: User | null) => {
  cachedToken = token;
  currentUser = user;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('lg_auth_token', token);
    else localStorage.removeItem('lg_auth_token');

    if (user) localStorage.setItem('lg_user', JSON.stringify(user));
    else localStorage.removeItem('lg_user');
  }
};

export const getStoredUser = (): User | null => currentUser;

export const IS_DEMO = !BASE;

const wait = <T>(v: T, ms = 120): Promise<T> => new Promise(r => setTimeout(() => r(v), ms));

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (cachedToken) {
    headers.set('Authorization', `Bearer ${cachedToken}`);
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// Resilient local state storage
let localStations = [...initialStations];
let localAlerts = [...initialAlerts];
let localSettings: SystemSettings = {
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
        // Fallback to local session
      }
    }
    const localUser: User = {
      id: email.includes('nexara') ? 'usr-nex-001' : 'usr-eng-001',
      email: email || 'nexaraautotechsolution@gmail.com',
      name: email.includes('nexara') ? 'Nexara Mission Admin' : (email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Sarah Chen'),
      role: email.includes('admin') || email.includes('nexara') ? 'Admin' : 'Field Engineer'
    };
    const res: AuthResponse = {
      access_token: 'lg-jwt-active-session',
      token_type: 'bearer',
      user: localUser
    };
    setStoredSession(res.access_token, localUser);
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
        // Fallback
      }
    }
    const localUser: User = { id: `usr-${Date.now()}`, email, name, role };
    const res: AuthResponse = { access_token: 'lg-jwt-active-session', token_type: 'bearer', user: localUser };
    setStoredSession(res.access_token, localUser);
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
      id: 'usr-nex-001',
      email: 'nexaraautotechsolution@gmail.com',
      name: 'Nexara Mission Admin',
      role: 'Admin'
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
        // fallback
      }
    }
    return wait(localStations);
  },

  station: async (id: string): Promise<Station> => {
    if (BASE) {
      try {
        return await http<Station>(`/api/stations/${id}`);
      } catch (e) {
        // fallback
      }
    }
    const s = localStations.find(x => x.id === id) ?? localStations[0];
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
        // fallback
      }
    }
    const score = st.score ?? 25;
    const newStation: Station = {
      id: st.id || `STN-00${localStations.length + 1}`,
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
    localStations = [newStation, ...localStations];
    return wait(newStation);
  },

  calibrateStation: async (id: string): Promise<Station> => {
    if (BASE) {
      try {
        return await http<Station>(`/api/stations/${id}/calibrate`, { method: 'POST' });
      } catch (e) {
        // fallback
      }
    }
    const st = localStations.find(s => s.id === id);
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
        // fallback
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
        // fallback
      }
    }
    return wait(localAlerts.map(a => ({ ...a })));
  },

  acknowledge: async (id: string, responder = 'Mission Operator'): Promise<void> => {
    if (BASE) {
      try {
        await http(`/api/alerts/${id}/acknowledge`, {
          method: 'POST',
          body: JSON.stringify({ responder })
        });
        return;
      } catch (e) {
        // fallback
      }
    }
    const a = localAlerts.find(x => x.id === id);
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
        // fallback
      }
    }
    const loc = localStations.find(s => s.id === data.stationId)?.name || 'Regional Station';
    const alert: Alert = {
      id: `AL-${localAlerts.length + 101}`,
      stationId: data.stationId,
      location: loc,
      severity: data.severity,
      time: 'Just now',
      trigger: data.trigger,
      description: data.description,
      acknowledged: false
    };
    localAlerts = [alert, ...localAlerts];
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
        // fallback
      }
    }
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
    const total = localStations.length;
    return wait({
      total_stations: total,
      critical_count: localStations.filter(s => s.risk === 'Critical').length,
      high_count: localStations.filter(s => s.risk === 'High').length,
      online_count: localStations.filter(s => s.status === 'online').length,
      stale_count: localStations.filter(s => s.status === 'stale').length,
      offline_count: localStations.filter(s => s.status === 'offline').length,
      average_soil_saturation_pct: +(localStations.reduce((a, b) => a + b.soil, 0) / Math.max(1, total)).toFixed(1),
      peak_rainfall_rate_mm: +(Math.max(...localStations.map(s => s.rainfall), 0)).toFixed(1),
      total_alerts: localAlerts.length,
      unacknowledged_alerts: localAlerts.filter(a => !a.acknowledged).length
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
    return wait({ ...localSettings });
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
    localSettings = { ...settings };
    return wait({ ...localSettings });
  }
};
