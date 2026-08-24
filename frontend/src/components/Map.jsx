import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
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
      <div className="w-8 h-8 flex items-center justify-center -ml-4 -mt-8 relative">
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
      if (playbackIndex >= positions.length - 1) {
        setPlaybackIndex(0);
      }
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
  }, [isPlaying, positions.length, playbackIndex]);

  if (!telemetryData || telemetryData.length === 0) return null;

  const center = positions[0];
  const currentPath = positions.slice(0, playbackIndex + 1);
  const currentPoint = positions[playbackIndex];

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-[400] bg-white rounded-lg shadow-md p-2 flex gap-2">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-md transition-colors"
          title={isPlaying ? "Pause" : "Play Flight"}
        >
          {isPlaying ? <Square size={18} /> : <Play size={18} />}
        </button>
      </div>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Polyline 
        positions={positions} 
        color="#cbd5e1" 
        weight={4} 
        opacity={0.5}
        lineCap="round"
        lineJoin="round"
        dashArray="1, 8"
      />
      <Polyline 
        positions={currentPath} 
        color="#3b82f6" 
        weight={4} 
        opacity={0.8}
        lineCap="round"
        lineJoin="round"
      />
      
      {currentPoint && (
        <CircleMarker 
          center={currentPoint}
          radius={6}
          pathOptions={{ color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 1 }}
        />
      )}

      {/* Render Issue Markers */}
      {issues.map((point, idx) => (
        <Marker 
          key={`issue-${idx}`} 
          position={[point.latitude, point.longitude]}
          icon={issueIcon}
        >
          <Popup className="rounded-lg shadow-lg">
            <div className="p-1">
              <h4 className="font-bold text-red-600 flex items-center gap-1.5 text-sm mb-1">
                <AlertTriangle size={14} /> Anomaly Detected
              </h4>
              <p className="text-slate-700 text-sm mb-2">{point.issue}</p>
              <div className="bg-slate-50 p-2 rounded text-xs text-slate-500 font-mono">
                <div>Alt: {point.altitude}m</div>
                <div>Batt: {point.battery}%</div>
                <div>Time: {new Date(point.timestamp).toLocaleTimeString()}</div>
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
