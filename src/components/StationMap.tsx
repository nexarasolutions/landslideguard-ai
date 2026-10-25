import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Station } from '../types';
import { RC } from './ui';

export default function StationMap({ stations, onSelect }: { stations: Station[]; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const initializedViewRef = useRef<boolean>(false);

  const target = stations[0];
  const lat = target && target.lat && target.lat !== 0 ? target.lat : 11.3164;
  const lng = target && target.lng && target.lng !== 0 ? target.lng : 77.5525;
  const risk = target?.risk ?? 'Low';
  const name = target?.name ?? 'LandslideGuard AI Node';
  const id = target?.id ?? 'STN-001';
  const soil = target?.soil ?? 0;
  const rainfall = target?.rainfall ?? 0;
  const tilt = target?.tilt ?? 0;
  const score = target?.score ?? 0;

  // Initialize Map container once
  useEffect(() => {
    if (!ref.current || mapInstanceRef.current) return;

    const map = L.map(ref.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([lat, lng], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    initializedViewRef.current = true;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      initializedViewRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position and contents in-place without reloading the map or resetting view
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const popupHtml = `
      <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; padding: 2px;">
        <b style="font-size: 13px; color: #0f172a;">${name} (${id})</b><br/>
        <span style="color: #64748b;">Live GPS:</span> <b>${lat.toFixed(5)}°, ${lng.toFixed(5)}°</b><br/>
        <span>Risk: <b style="color: ${RC[risk]};">${risk} (${score}/100)</b></span><br/>
        <span>Soil: <b>${soil}%</b> · Rain: <b>${rainfall} mm/h</b> · Tilt: <b>${tilt}°</b></span><br/>
        <span style="color: #10b981; font-weight: 600;">● Active GPS Satellite Telemetry</span>
      </div>
    `;

    if (!markerRef.current) {
      const marker = L.circleMarker([lat, lng], {
        radius: 12,
        color: '#ffffff',
        weight: 2.5,
        fillColor: RC[risk],
        fillOpacity: 0.95
      })
        .addTo(map)
        .bindPopup(popupHtml)
        .on('click', () => onSelect(id));

      markerRef.current = marker;
    } else {
      // Smoothly update marker coordinates and styling without recreating DOM
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setStyle({ fillColor: RC[risk] });
      markerRef.current.setPopupContent(popupHtml);
    }
  }, [lat, lng, risk, name, id, soil, rainfall, tilt, score, onSelect]);

  const displayLat = lat.toFixed(5);
  const displayLng = lng.toFixed(5);

  return (
    <div>
      <div
        ref={ref}
        className="z-0 h-80 w-full rounded-lg shadow-inner"
        role="application"
        aria-label="Live Geospatial Station Location"
      />
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
