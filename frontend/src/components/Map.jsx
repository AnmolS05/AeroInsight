import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Info, Play, Square } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix for default marker icon issues in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker for issues
const createIssueIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: renderToString(
      <div className="w-8 h-8 flex items-center justify-center -ml-4 -mt-8 relative hazard-glow rounded-full">
        <div className="absolute inset-0 bg-red-500 rounded-full opacity-30 animate-ping"></div>
        <div className="relative bg-red-500 rounded-full p-1 shadow-lg border-2 border-white text-white">
          <AlertTriangle size={16} />
        </div>
        <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500"></div>
      </div>
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const issueIcon = createIssueIcon();

// Component to dynamically adjust map bounds
function MapBounds({ positions }) {
  const map = useMap();

  React.useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);

  return null;
}

export default function Map({ telemetryData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const positions = useMemo(() => {
    return telemetryData.map(d => [d.latitude, d.longitude]);
  }, [telemetryData]);

  const issues = useMemo(() => {
    return telemetryData.filter(d => d.issue && d.issue.toLowerCase() !== 'none');
  }, [telemetryData]);

  useEffect(() => {
    setPlaybackIndex(positions.length - 1);
    setIsPlaying(false);
  }, [telemetryData, positions.length]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= positions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // speed of playback
    }
    return () => clearInterval(interval);
  }, [isPlaying, positions.length]);

  if (!telemetryData || telemetryData.length === 0) return null;

  const center = positions[0];
  const currentPath = positions.slice(0, playbackIndex + 1);
  const currentPoint = positions[playbackIndex];

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-[400] bg-[#0a0f1c]/40 backdrop-blur-xl rounded-[1rem] shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-white/10 p-2 flex gap-2">
        <button
          onClick={() => {
            if (!isPlaying && playbackIndex >= positions.length - 1) {
              setPlaybackIndex(0);
            }
            setIsPlaying(!isPlaying);
          }}
          className="p-3 bg-white/5 hover:bg-white/10 text-indigo-400 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-transparent hover:border-indigo-500/30"
          title={isPlaying ? "Pause" : "Play Flight"}
        >
          {isPlaying ? <Square size={18} className="fill-indigo-400" /> : <Play size={18} className="fill-indigo-400 ml-0.5" />}
        </button>
      </div>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <svg style={{ height: 0, width: 0, position: 'absolute' }}>
          <defs>
            <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={`https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
        />
        <Polyline
          positions={positions}
          color="#1e293b"
          weight={4}
          opacity={0.5}
          lineCap="round"
          lineJoin="round"
          dashArray="1, 8"
          className="glowing-path"
        />
        <Polyline
          positions={currentPath}
          color="url(#path-gradient)"
          weight={4}
          opacity={0.8}
          lineCap="round"
          lineJoin="round"
          dashArray="15, 10"
          className="glowing-path"
        />

        {/* Start Marker */}
        {positions.length > 0 && (
          <CircleMarker
            center={positions[0]}
            radius={5}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 1, weight: 2, className: 'node-ripple-green' }}
          >
            <Popup className="rounded-[1rem] shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="p-2">
                <h4 className="font-black text-emerald-500 text-xs mb-1 uppercase tracking-widest">Takeoff Location</h4>
                <p className="text-slate-200 text-xs font-mono">{positions[0][0].toFixed(5)}, {positions[0][1].toFixed(5)}</p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* End Marker */}
        {positions.length > 1 && (
          <CircleMarker 
            center={positions[positions.length - 1]}
            radius={5}
            pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 1, weight: 2, className: 'node-ripple-blue' }}
          >
            <Popup className="rounded-[1rem] shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <div className="p-2">
                <h4 className="font-black text-indigo-500 text-xs mb-1 uppercase tracking-widest">Landing Location</h4>
                <p className="text-slate-200 text-xs font-mono">{positions[positions.length - 1][0].toFixed(5)}, {positions[positions.length - 1][1].toFixed(5)}</p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Current Position Marker (Playback) */}
        {currentPoint && (
          <CircleMarker
            center={currentPoint}
            pathOptions={{ color: '#818cf8', fillColor: '#6366f1', fillOpacity: 1, className: 'playhead-pulse' }}
          />
        )}

        {/* Render Issue Markers */}
        {issues.map((point, idx) => (
          <Marker
            key={`issue-${idx}`}
            position={[point.latitude, point.longitude]}
            icon={issueIcon}
          >
            <Popup className="rounded-[1rem] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <div className="p-2">
                <h4 className="font-black text-rose-500 flex items-center gap-2 text-xs mb-2 uppercase tracking-widest drop-shadow-md">
                  <AlertTriangle size={14} /> Anomaly Detected
                </h4>
                <p className="text-slate-200 text-sm mb-3 font-medium">{point.issue}</p>
                <div className="bg-[#0a0f1c] p-3 rounded-xl border border-rose-500/20 text-xs text-slate-400 font-mono flex flex-col gap-1">
                  <div><span className="text-slate-500">ALT:</span> {point.altitude}m</div>
                  <div><span className="text-slate-500">BATT:</span> {point.battery}%</div>
                  <div><span className="text-slate-500">TIME:</span> {new Date(point.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapBounds positions={positions} />
      </MapContainer>
    </div>
  );
}
