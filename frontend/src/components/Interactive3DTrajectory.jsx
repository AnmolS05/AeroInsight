/**
 * @file Interactive3DTrajectory.jsx
 * @description Lightweight, high-performance 3D trajectory canvas visualizer.
 * Provides real-time 3D orbit rotation, zoom, altitude-gradient ribbon rendering,
 * and illuminated anomaly hazard beacons directly in the web dashboard.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, AlertTriangle, Compass } from 'lucide-react';

/**
 * Interactive 3D Trajectory Canvas component.
 *
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.telemetry - Telemetry data points.
 * @param {Function} [props.onSelectWaypoint] - Callback when a waypoint is clicked.
 * @returns {React.ReactElement} The rendered 3D viewport.
 */
export default function Interactive3DTrajectory({ telemetry = [], onSelectWaypoint }) {
  const canvasRef = useRef(null);

  // Viewport camera parameters
  const [pitch, setPitch] = useState(35); // degrees
  const [yaw, setYaw] = useState(45); // degrees
  const [zoom, setZoom] = useState(1.0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [playbackT, setPlaybackT] = useState(0); // 0 to 1 along path

  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // 1. Process 3D coordinates relative to origin
  const waypoints3D = useMemo(() => {
    if (!telemetry || telemetry.length === 0) return [];

    const originLat = telemetry[0].latitude;
    const originLon = telemetry[0].longitude;
    const METERS_PER_DEG_LAT = 111139.0;
    const METERS_PER_DEG_LON = 111139.0 * Math.cos((originLat * Math.PI) / 180.0);

    const pts = telemetry.map((pt, index) => {
      const x = (pt.longitude - originLon) * METERS_PER_DEG_LON;
      const y = pt.altitude;
      const z = (pt.latitude - originLat) * METERS_PER_DEG_LAT;
      const isAnomaly = Boolean(pt.issue && pt.issue.toLowerCase() !== 'none' && pt.issue.trim() !== '');

      return {
        index,
        x,
        y,
        z,
        raw: pt,
        isAnomaly
      };
    });

    // Calculate center offset to center model at (0, 0, 0)
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const centerX = (minX + maxX) / 2 || 0;
    const centerZ = (minZ + maxZ) / 2 || 0;
    const centerY = (minY + maxY) / 2 || 0;
    const maxSpan = Math.max(maxX - minX, maxZ - minZ, maxY - minY, 30);

    return pts.map((p) => ({
      ...p,
      normX: (p.x - centerX) / (maxSpan * 0.7),
      normY: (p.y - centerY) / (maxSpan * 0.7),
      normZ: (p.z - centerZ) / (maxSpan * 0.7)
    }));
  }, [telemetry]);

  // 2. Animated drone movement loop
  useEffect(() => {
    let animId;
    let start = performance.now();

    const loop = (now) => {
      const elapsed = (now - start) / 1000;
      const duration = 12; // 12 seconds per loop
      const t = (elapsed % duration) / duration;
      setPlaybackT(t);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 3. Render 3D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = '#0a0b0f';
    ctx.fillRect(0, 0, width, height);

    // Rotation angles in radians
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    const cosY = Math.cos(radYaw);
    const sinY = Math.sin(radYaw);
    const cosP = Math.cos(radPitch);
    const sinP = Math.sin(radPitch);

    // 3D projection function: maps normalized 3D (x, y, z) to 2D screen (sx, sy)
    const project = (x, y, z) => {
      // 1. Yaw rotation around Y
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // 2. Pitch rotation around X
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;

      // 3. Perspective projection
      const cameraDistance = 2.5;
      const fov = 350 * zoom;
      const depth = z2 + cameraDistance;

      const scale = depth > 0.1 ? fov / depth : 0.1;
      const sx = width / 2 + x1 * scale;
      const sy = height / 2 - y2 * scale;

      return { sx, sy, depth, visible: depth > 0.1 };
    };

    // Draw Ground Reference Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 1.0;
    const gridDivs = 8;
    const step = (gridSize * 2) / gridDivs;

    for (let i = -gridSize; i <= gridSize; i += step) {
      const p1 = project(i, -0.6, -gridSize);
      const p2 = project(i, -0.6, gridSize);
      if (p1.visible && p2.visible) {
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      const q1 = project(-gridSize, -0.6, i);
      const q2 = project(gridSize, -0.6, i);
      if (q1.visible && q2.visible) {
        ctx.beginPath();
        ctx.moveTo(q1.sx, q1.sy);
        ctx.lineTo(q2.sx, q2.sy);
        ctx.stroke();
      }
    }

    if (waypoints3D.length < 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No 3D trajectory data available', width / 2, height / 2);
      return;
    }

    // Project all waypoints to screen
    const screenPts = waypoints3D.map((wp) => ({
      ...wp,
      ...project(wp.normX, wp.normY, wp.normZ)
    }));

    // Draw trajectory shadow onto ground plane
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(41, 151, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i < waypoints3D.length; i++) {
      const shadowPt = project(waypoints3D[i].normX, -0.6, waypoints3D[i].normZ);
      if (i === 0) ctx.moveTo(shadowPt.sx, shadowPt.sy);
      else ctx.lineTo(shadowPt.sx, shadowPt.sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vertical drops from waypoints to shadow (every 4th point)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < screenPts.length; i += Math.max(1, Math.floor(screenPts.length / 10))) {
      const pt = screenPts[i];
      const shadowPt = project(waypoints3D[i].normX, -0.6, waypoints3D[i].normZ);
      if (pt.visible && shadowPt.visible) {
        ctx.beginPath();
        ctx.moveTo(pt.sx, pt.sy);
        ctx.lineTo(shadowPt.sx, shadowPt.sy);
        ctx.stroke();
      }
    }

    // Draw 3D Spline Path Ribbon
    ctx.beginPath();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer cyan glow
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;

    for (let i = 0; i < screenPts.length; i++) {
      const pt = screenPts[i];
      if (!pt.visible) continue;
      if (i === 0) ctx.moveTo(pt.sx, pt.sy);
      else ctx.lineTo(pt.sx, pt.sy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset glow

    // Draw Anomaly Indicators
    for (let i = 0; i < screenPts.length; i++) {
      const pt = screenPts[i];
      if (!pt.visible) continue;

      if (pt.isAnomaly) {
        // Glowing Anomaly Beacon
        ctx.shadowColor = '#ff453a';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ff453a';
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer halo
        ctx.strokeStyle = 'rgba(255, 69, 58, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Draw Animated Drone Position
    const droneIdx = Math.floor(playbackT * (screenPts.length - 1));
    const nextIdx = Math.min(droneIdx + 1, screenPts.length - 1);
    const subT = (playbackT * (screenPts.length - 1)) % 1;

    const pA = screenPts[droneIdx];
    const pB = screenPts[nextIdx];

    if (pA && pB && pA.visible && pB.visible) {
      const droneX = pA.sx + (pB.sx - pA.sx) * subT;
      const droneY = pA.sy + (pB.sy - pA.sy) * subT;

      // Drone Core
      ctx.shadowColor = '#30d158';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#30d158';
      ctx.beginPath();
      ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Drone Heading Arrow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(droneX, droneY, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [pitch, yaw, zoom, waypoints3D, playbackT]);

  // Mouse interaction handlers for smooth 3D orbiting
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;

    setYaw((prev) => (prev + deltaX * 0.6) % 360);
    setPitch((prev) => Math.max(-10, Math.min(85, prev + deltaY * 0.6)));

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.4, Math.min(3.0, prev - e.deltaY * 0.0015)));
  };

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden bg-[#0a0b0f] border border-white/10 select-none">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating Viewport Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/70">
        <button
          onClick={() => setZoom((prev) => Math.min(3.0, prev * 1.2))}
          className="p-1.5 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(0.4, prev / 1.2))}
          className="p-1.5 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setPitch(35);
            setYaw(45);
            setZoom(1.0);
          }}
          className="p-1.5 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Reset Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* HUD Info Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Flight Trajectory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>Anomaly Hazard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Live Drone</span>
        </div>
      </div>
    </div>
  );
}
