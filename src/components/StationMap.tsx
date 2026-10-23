import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Station } from '../types';
import { RC } from './ui';

export default function StationMap({ stations, onSelect }: { stations: Station[]; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !stations.length) return;
    const map = L.map(ref.current).setView([stations[0].lat, stations[0].lng], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const markers = stations.map(s =>
      L.circleMarker([s.lat, s.lng], { radius: 11, color: '#fff', weight: 2, fillColor: RC[s.risk], fillOpacity: 0.95 })
        .addTo(map)
        .bindPopup(`<b>${s.id}</b> · ${s.name}<br/>Estimated risk: ${s.risk} (${s.score}/100)<br/><i>DEMO DATA — sample location</i>`)
        .on('click', () => onSelect(s.id)));
    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.3));
    return () => { map.remove(); };
  }, [stations, onSelect]);
  return (
    <div>
      <div ref={ref} className="z-0 h-80 w-full rounded-lg" role="application" aria-label="Map of monitoring stations (demo)" />
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
        {(Object.keys(RC) as (keyof typeof RC)[]).map(k => <span key={k} className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-full" style={{ background: RC[k] }} />{k}</span>)}
        <span className="text-amber-300">Sample locations only · not real hazard zones</span>
      </div>
    </div>
  );
}
