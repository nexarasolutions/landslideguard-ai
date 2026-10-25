import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Station } from '../types';
import { RC } from './ui';

export default function StationMap({ stations, onSelect }: { stations: Station[]; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!ref.current || !stations.length) return;

    const target = stations[0];
    const initialLat = target.lat && target.lat !== 0 ? target.lat : 11.3164;
    const initialLng = target.lng && target.lng !== 0 ? target.lng : 77.5525;

    if (!mapInstanceRef.current) {
      const map = L.map(ref.current).setView([initialLat, initialLng], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Create markers for stations
    const markers = stations.map(s => {
      const lat = s.lat && s.lat !== 0 ? s.lat : 11.3164;
      const lng = s.lng && s.lng !== 0 ? s.lng : 77.5525;

      const marker = L.circleMarker([lat, lng], {
        radius: 12,
        color: '#ffffff',
        weight: 2.5,
        fillColor: RC[s.risk],
        fillOpacity: 0.95
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5;">
            <b style="font-size: 13px;">${s.name} (${s.id})</b><br/>
            <span style="color: #64748b;">GPS Fix:</span> <b>${lat.toFixed(5)}°, ${lng.toFixed(5)}°</b><br/>
            <span>Hazard Risk: <b style="color: ${RC[s.risk]};">${s.risk} (${s.score}/100)</b></span><br/>
            <span>Soil: <b>${s.soil}%</b> · Rain: <b>${s.rainfall} mm/h</b> · Tilt: <b>${s.tilt}°</b></span><br/>
            <span style="color: #10b981; font-weight: 600;">● Live Satellite Coordinates</span>
          </div>
        `)
        .on('click', () => onSelect(s.id));

      return marker;
    });

    markersRef.current = markers;

    if (stations.length === 1) {
      map.setView([initialLat, initialLng], 14, { animate: true });
    } else if (markers.length > 0) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.3));
    }
  }, [stations, onSelect]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const st = stations[0];
  const displayLat = st && st.lat ? st.lat.toFixed(5) : '11.31637';
  const displayLng = st && st.lng ? st.lng.toFixed(5) : '77.55252';

  return (
    <div>
      <div ref={ref} className="z-0 h-80 w-full rounded-lg shadow-inner" role="application" aria-label="Live Geospatial Station Location" />
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-300">
          {(Object.keys(RC) as (keyof typeof RC)[]).map(k => (
            <span key={k} className="flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: RC[k] }} />
              {k}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live GPS: <b>{displayLat}° N, {displayLng}° E</b></span>
        </div>
      </div>
    </div>
  );
}
