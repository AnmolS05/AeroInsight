/**
 * @file Map.jsx
 * @description Apple Maps-inspired flight path visualizer with playback simulation and anomaly inspection.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix default leaflet marker asset paths for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Generates an accessible, minimal Apple-style anomaly marker icon.
 *
 * @returns {L.DivIcon} Leaflet DivIcon instance.
 */
const createIssueIcon = () => {
  return L.divIcon({
    className: 'apple-map-marker',
    html: renderToString(
      <div className="w-6 h-6 rounded-full bg-[#ff453a] text-white flex items-center justify-center shadow-lg border border-white/40">
        <AlertCircle size={14} className="stroke-[2.5]" />
      </div>
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });
};

const issueIcon = createIssueIcon();

/**
 * Helper hook component to automatically fit the map viewport to all telemetry points.
 *
 * @param {Object} props - Component properties.
 * @param {Array<Array<number>>} props.positions - List of [lat, lng] coordinates.
 * @returns {null} Renders no direct DOM.
 */
function MapBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [map, positions]);

  return null;
}

/**
 * Main Flight Trajectory Map component.
 *
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.telemetryData - Telemetry data points.
 * @returns {React.ReactElement|null} Rendered map or null if data is empty.
 */
export default function Map({ telemetryData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const positions = useMemo(() => {
    return (telemetryData || []).map(d => [d.latitude, d.longitude]);
  }, [telemetryData]);

  const issues = useMemo(() => {
    return (telemetryData || []).filter(d => d.issue && d.issue.toLowerCase() !== 'none');
  }, [telemetryData]);

  useEffect(() => {
    setPlaybackIndex(positions.length > 0 ? positions.length - 1 : 0);
    setIsPlaying(false);
  }, [positions.length]);

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
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isPlaying, positions.length]);

  if (!telemetryData || telemetryData.length === 0) return null;

  const center = positions[0] || [0, 0];
  const currentPath = positions.slice(0, playbackIndex + 1);
  const currentPoint = positions[playbackIndex];

  return (
    <div className="relative w-full h-full select-none overflow-hidden rounded-2xl">
      {/* Floating Minimal Playback Controls */}
      <div className="absolute top-3 right-3 z-[400] bg-[#18181b]/90 backdrop-blur-md border border-white/[0.12] rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg text-xs">
        <button
          onClick={() => {
            if (!isPlaying && playbackIndex >= positions.length - 1) {
              setPlaybackIndex(0);
            }
            setIsPlaying(!isPlaying);
          }}
          className="w-7 h-7 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-95 flex items-center justify-center transition-all"
          title={isPlaying ? "Pause replay" : "Play trajectory"}
          aria-label={isPlaying ? "Pause replay" : "Play trajectory"}
        >
          {isPlaying ? <Pause size={12} className="fill-black" /> : <Play size={12} className="fill-black ml-0.5" />}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            setPlaybackIndex(positions.length - 1);
          }}
          className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 flex items-center justify-center transition-all"
          title="Reset to end"
          aria-label="Reset replay"
        >
          <RotateCcw size={12} />
        </button>

        <span className="text-[11px] font-medium text-neutral-400 tabular-nums px-1">
          {playbackIndex + 1} / {positions.length}
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <ZoomControl position="bottomright" />
        
        {/* CARTO Dark Tile Layer with minimal contrast */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={import.meta.env.VITE_CARTO_API_KEY ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_API_KEY}` : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"}
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Full planned path baseline */}
        <Polyline
          positions={positions}
          color="rgba(255, 255, 255, 0.15)"
          weight={3}
          lineCap="round"
          lineJoin="round"
          dashArray="4, 6"
        />

        {/* Current active flight path */}
        <Polyline
          positions={currentPath}
          color="#2997ff"
          weight={3.5}
          opacity={0.95}
          lineCap="round"
          lineJoin="round"
        />

        {/* Takeoff Location Marker */}
        {positions.length > 0 && (
          <CircleMarker
            center={positions[0]}
            radius={5}
            pathOptions={{ color: '#ffffff', fillColor: '#30d158', fillOpacity: 1, weight: 1.5 }}
          >
            <Popup className="apple-popup">
              <div className="p-1 text-xs">
                <p className="font-semibold text-[#30d158] uppercase tracking-wider text-[10px]">Takeoff Point</p>
                <p className="text-neutral-300 font-mono text-[11px] mt-0.5">
                  {positions[0][0].toFixed(5)}, {positions[0][1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Landing / Target Location Marker */}
        {positions.length > 1 && (
          <CircleMarker
            center={positions[positions.length - 1]}
            radius={5}
            pathOptions={{ color: '#ffffff', fillColor: '#2997ff', fillOpacity: 1, weight: 1.5 }}
          >
            <Popup className="apple-popup">
              <div className="p-1 text-xs">
                <p className="font-semibold text-[#2997ff] uppercase tracking-wider text-[10px]">Landing Point</p>
                <p className="text-neutral-300 font-mono text-[11px] mt-0.5">
                  {positions[positions.length - 1][0].toFixed(5)}, {positions[positions.length - 1][1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Live Playhead Marker */}
        {currentPoint && (
          <CircleMarker
            center={currentPoint}
            radius={6}
            pathOptions={{ color: '#ffffff', fillColor: '#2997ff', fillOpacity: 1, weight: 2 }}
          />
        )}

        {/* Anomaly / Issue Flag Markers */}
        {issues.map((point, idx) => (
          <Marker
            key={`issue-${idx}`}
            position={[point.latitude, point.longitude]}
            icon={issueIcon}
          >
            <Popup className="apple-popup">
              <div className="p-2 min-w-[190px] text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#ff453a] mb-1">
                  <AlertCircle size={14} /> Anomaly Flagged
                </div>
                <p className="text-neutral-200 font-medium leading-snug mb-2">{point.issue}</p>
                <div className="bg-black/40 rounded-lg p-2 text-[11px] text-neutral-400 space-y-0.5 font-mono border border-white/10">
                  <div>ALT: {point.altitude}m</div>
                  <div>BAT: {point.battery}%</div>
                  <div>TIME: {new Date(point.timestamp).toLocaleTimeString()}</div>
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
