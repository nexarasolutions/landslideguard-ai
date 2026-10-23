export type Risk = 'Low' | 'Moderate' | 'High' | 'Critical';
export type ConnStatus = 'online' | 'stale' | 'offline';
export type UserRole = 'Admin' | 'Field Engineer' | 'Geologist' | 'Operator';

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rainfall: number;
  soil: number;
  tilt: number;
  vibration: number; // mm, %, deg, mm/s
  battery: number;
  signal: number;
  lastSeenMin: number;
  status: ConnStatus;
  score: number;
  risk: Risk;
}

export interface Reading {
  t: string;
  rainfall: number | null;
  soil: number | null;
  tilt: number | null;
  vibration: number | null;
}

export interface Alert {
  id: string;
  stationId: string;
  location: string;
  severity: Risk;
  time: string;
  trigger: string;
  description: string;
  acknowledged: boolean;
  responder?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ScenarioRequest {
  rainfall_intensity_mm: number;
  storm_duration_hours: number;
  soil_saturation_pct: number;
  slope_angle_deg: number;
  drainage_capacity_pct: number;
}

export interface ScenarioResponse {
  projected_risk_score: number;
  projected_risk_level: Risk;
  pore_water_pressure_kpa: number;
  factor_of_safety: number;
  time_to_critical_hours: number | null;
  warning_statement: string;
  factors: { factor: string; impact: string; weight: number }[];
}

export interface AnalyticsSummary {
  total_stations: number;
  critical_count: number;
  high_count: number;
  online_count: number;
  stale_count: number;
  offline_count: number;
  average_soil_saturation_pct: number;
  peak_rainfall_rate_mm: number;
  total_alerts: number;
  unacknowledged_alerts: number;
}

export interface SystemSettings {
  rainfall_threshold_high_mm: number;
  rainfall_threshold_crit_mm: number;
  soil_moisture_threshold_pct: number;
  tilt_threshold_deg: number;
  vibration_threshold_mms: number;
  alert_email_enabled: boolean;
  alert_sms_enabled: boolean;
  auto_refresh_seconds: number;
}
