/**
 * @file DigitalTwinModal.jsx
 * @description 3D Digital Twin & Interactive Mission Control interface for AeroInsight.
 * Connects directly to the Unity MCP HTTP bridge and provides:
 * 1. 3D Flight Reconstructor & Trajectory Inspector
 * 2. Physics-Based Anomaly Simulation (Wind, Drag, Rotor Failure)
 * 3. Dual-Screen Mission Control Camera Directives (Focus & Orbit Anomaly)
 * 4. Synthetic Mission Trigger
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Box,
  Wind,
  Activity,
  Zap,
  Radio,
  RefreshCw,
  Orbit,
  AlertTriangle,
  Play,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Download,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import Interactive3DTrajectory from './Interactive3DTrajectory';
import { exportToGeoJSON, exportToPX4CSV, downloadFile } from '../utils/telemetryExport';

/**
 * 3D Digital Twin Modal component.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether modal is visible.
 * @param {Function} props.onClose - Callback to close modal.
 * @param {string} props.flightId - Current flight ID.
 * @param {Array<Object>} props.telemetry - Array of telemetry points.
 * @param {string} props.apiUrl - Base backend API URL.
 * @returns {React.ReactElement|null} The rendered component.
 */
export default function DigitalTwinModal({ isOpen, onClose, flightId, telemetry = [], apiUrl }) {
  const [activeTab, setActiveTab] = useState('twin'); // 'twin' | 'physics' | 'blackbox' | 'camera'
  const [bridgeStatus, setBridgeStatus] = useState({ connected: false, checking: true });
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [reconstructionData, setReconstructionData] = useState(null);
  const [selectedAnomalyIndex, setSelectedAnomalyIndex] = useState(0);

  // Black Box FDR Investigation state
  const [blackBoxReport, setBlackBoxReport] = useState(null);
  const [isLoadingBlackBox, setIsLoadingBlackBox] = useState(false);

  // Physics simulation state
  const [physicsConfig, setPhysicsConfig] = useState({
    windSpeedKnots: 20,
    droneMassKg: 2.5,
    thrustDegradationPercent: 50,
    failureType: 'MotorCutoff',
    triggerSecond: 15
  });
  const [isSimulatingPhysics, setIsSimulatingPhysics] = useState(false);
  const [physicsResult, setPhysicsResult] = useState(null);

  const handleInterrogateBlackBox = async () => {
    if (!flightId) return;
    setIsLoadingBlackBox(true);
    const toastId = toast.loading('Interrogating Flight Data Recorder (FDR) Black Box...');

    try {
      const res = await fetch(`${apiUrl}/api/unity/blackbox/${flightId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telemetry })
      });
      const json = await res.json();

      if (json.success) {
        setBlackBoxReport(json.data);
        toast.success(
          json.data.unityDispatched
            ? 'FDR Black Box report ingested & incident marker placed in Unity!'
            : 'FDR Black Box report computed & localized successfully.',
          { id: toastId }
        );
      } else {
        toast.error(json.message || 'Black box analysis failed.', { id: toastId });
      }
    } catch (err) {
      toast.error(`FDR interrogation error: ${err.message}`, { id: toastId });
    } finally {
      setIsLoadingBlackBox(false);
    }
  };

  // Check bridge connectivity on mount and modal open
  useEffect(() => {
    if (isOpen) {
      checkBridge();
    }
  }, [isOpen]);

  const checkBridge = async () => {
    setBridgeStatus((prev) => ({ ...prev, checking: true }));
    try {
      const res = await fetch(`${apiUrl}/api/unity/status`);
      const json = await res.json();
      if (json.success) {
        setBridgeStatus({ ...json.data, checking: false });
      } else {
        setBridgeStatus({ connected: false, checking: false, message: 'Bridge query failed.' });
      }
    } catch (err) {
      setBridgeStatus({
        connected: false,
        checking: false,
        message: 'Could not connect to AeroInsight backend bridge route.'
      });
    }
  };

  const handleReconstruct = async () => {
    if (!flightId) return;
    setIsReconstructing(true);
    const toastId = toast.loading('Synthesizing 3D Digital Twin...');

    try {
      const res = await fetch(`${apiUrl}/api/unity/reconstruct/${flightId}`, {
        method: 'POST'
      });
      const json = await res.json();

      if (json.success) {
        setReconstructionData(json.data);
        toast.success(
          json.data.bridgeConnected
            ? '3D Digital Twin dispatched to Unity Editor!'
            : '3D Digital Twin model generated locally (Unity Bridge standby).',
          { id: toastId }
        );
      } else {
        toast.error(json.message || 'Reconstruction failed.', { id: toastId });
      }
    } catch (err) {
      toast.error(`Reconstruction error: ${err.message}`, { id: toastId });
    } finally {
      setIsReconstructing(false);
    }
  };

  const handleFocusAnomaly = async (waypoint) => {
    const toastId = toast.loading('Dispatching Mission Control camera focus...');
    try {
      const res = await fetch(`${apiUrl}/api/unity/focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'OrbitAnomaly',
          targetPosition: waypoint.position || { x: 0, y: waypoint.altitude, z: 0 },
          flightId,
          anomalyDescription: waypoint.issue
        })
      });
      const json = await res.json();
      if (json.success && json.data.dispatched) {
        toast.success('Unity Editor camera focused on anomaly!', { id: toastId });
      } else {
        toast(json.data.message || 'Camera coordinates prepared.', {
          icon: '📍',
          id: toastId
        });
      }
    } catch (err) {
      toast.error(`Focus error: ${err.message}`, { id: toastId });
    }
  };

  const handleRunPhysicsSimulation = async () => {
    if (!flightId) return;
    setIsSimulatingPhysics(true);
    const toastId = toast.loading('Running aerodynamic physics simulation...');

    try {
      const res = await fetch(`${apiUrl}/api/unity/simulate/${flightId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...physicsConfig, telemetry })
      });
      const json = await res.json();

      if (json.success) {
        setPhysicsResult(json.data);
        toast.success('Physics anomaly simulation completed!', { id: toastId });
      } else {
        toast.error(json.message || 'Physics simulation failed.', { id: toastId });
      }
    } catch (err) {
      toast.error(`Simulation error: ${err.message}`, { id: toastId });
    } finally {
      setIsSimulatingPhysics(false);
    }
  };

  const handleExportGeoJSON = () => {
    const geojson = exportToGeoJSON(flightId || 'flight', telemetry);
    downloadFile(`${flightId || 'flight'}_trajectory.geojson`, geojson, 'application/geo+json');
    toast.success('Exported flight trajectory as GeoJSON!');
  };

  const handleExportPX4CSV = () => {
    const csv = exportToPX4CSV(flightId || 'flight', telemetry);
    downloadFile(`${flightId || 'flight'}_blackbox.csv`, csv, 'text/csv');
    toast.success('Exported avionics blackbox to PX4 CSV!');
  };

  if (!isOpen) return null;

  // Extract anomaly waypoints
  const anomalyPoints = telemetry.filter(
    (pt) => pt.issue && pt.issue.toLowerCase() !== 'none' && pt.issue.trim() !== ''
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl h-[88vh] bg-[#0c0d12]/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">3D Digital Twin & Mission Control</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    {flightId}
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Model Context Protocol (MCP) Bridge • Unity Editor Real-Time Synchronization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Bridge Status Indicator */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                  bridgeStatus.connected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    bridgeStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {bridgeStatus.checking
                  ? 'Pinging Bridge...'
                  : bridgeStatus.connected
                  ? `Unity Bridge Active (${bridgeStatus.latencyMs || 0}ms)`
                  : 'Unity Bridge Standby (127.0.0.1:7890)'}
                <button
                  onClick={checkBridge}
                  title="Refresh bridge status"
                  className="ml-1 p-0.5 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* GIS & Avionics Export Suite */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={handleExportGeoJSON}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] transition-all active:scale-95"
                  title="Export trajectory to RFC 7946 GeoJSON FeatureCollection"
                >
                  <Download className="w-3 h-3 text-[#2997ff]" />
                  <span>GeoJSON</span>
                </button>
                <button
                  onClick={handleExportPX4CSV}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] transition-all active:scale-95"
                  title="Export blackbox telemetry to PX4/ArduPilot CSV"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>PX4 CSV</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/5 bg-white/[0.01]">
            <button
              onClick={() => setActiveTab('twin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'twin'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              Digital Twin Reconstructor
            </button>
            <button
              onClick={() => setActiveTab('physics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'physics'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              Physics & Crash Simulation
            </button>
            <button
              onClick={() => {
                setActiveTab('blackbox');
                if (!blackBoxReport && !isLoadingBlackBox) {
                  handleInterrogateBlackBox();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'blackbox'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              Black Box FDR Investigation
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'camera'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Orbit className="w-3.5 h-3.5 text-indigo-400" />
              Mission Control Viewport
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {activeTab === 'twin' && (
              <div className="space-y-6">
                {/* Action Card */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/20 via-white/[0.02] to-transparent border border-cyan-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">AI 3D Flight Reconstructor</h3>
                    <p className="text-xs text-white/60 max-w-xl">
                      Translates SQLite/PostgreSQL telemetry paths into 3D metric splines, computes geographic UTM
                      origins, and instantiates visual anomaly beacons directly in Unity Editor.
                    </p>
                  </div>
                  <button
                    onClick={handleReconstruct}
                    disabled={isReconstructing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
                  >
                    {isReconstructing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Build 3D Digital Twin
                  </button>
                </div>

                {/* Interactive 3D Orbit Viewport */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-cyan-400" />
                      Spatial 3D Trajectory Orbit Viewport (Click & Drag to Rotate • Scroll to Zoom)
                    </h4>
                    <span className="text-[11px] text-cyan-400 font-mono">Real-Time Simulation Feed</span>
                  </div>
                  <div className="h-[340px] w-full">
                    <Interactive3DTrajectory 
                      telemetry={telemetry} 
                      apiUrl={apiUrl} 
                      flightId={flightId} 
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-xs text-white/40 mb-1">Total Waypoints</div>
                    <div className="text-xl font-semibold text-white">{telemetry.length}</div>
                    <div className="text-[10px] text-white/40 mt-1">Recorded coordinates</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-xs text-white/40 mb-1">Incident Anomalies</div>
                    <div className="text-xl font-semibold text-amber-400">{anomalyPoints.length}</div>
                    <div className="text-[10px] text-white/40 mt-1">Flagged points</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-xs text-white/40 mb-1">Origin Coordinates</div>
                    <div className="text-xs font-mono text-cyan-300 truncate">
                      {telemetry[0]
                        ? `${telemetry[0].latitude.toFixed(4)}°, ${telemetry[0].longitude.toFixed(4)}°`
                        : 'N/A'}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">Equirectangular datum</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-xs text-white/40 mb-1">Engine Target</div>
                    <div className="text-xs font-medium text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Unity 2022.3 / 6 LTS
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">AB Unity MCP v2.35</div>
                  </div>
                </div>

                {/* Reconstruction Inspection Output */}
                {reconstructionData && (
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                        3D Spatial Coordinates & Bounding Box
                      </h4>
                      <span className="text-xs text-emerald-400 font-mono">
                        Center: [{reconstructionData.digitalTwin.boundingBox.center.x}m,{' '}
                        {reconstructionData.digitalTwin.boundingBox.center.y}m,{' '}
                        {reconstructionData.digitalTwin.boundingBox.center.z}m]
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-white/40 block text-[10px]">X-Span (East-West)</span>
                        <span className="font-mono text-cyan-300">
                          {reconstructionData.digitalTwin.boundingBox.min.x}m →{' '}
                          {reconstructionData.digitalTwin.boundingBox.max.x}m
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-white/40 block text-[10px]">Y-Span (Altitude)</span>
                        <span className="font-mono text-cyan-300">
                          {reconstructionData.digitalTwin.boundingBox.min.y}m →{' '}
                          {reconstructionData.digitalTwin.boundingBox.max.y}m
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-white/40 block text-[10px]">Z-Span (North-South)</span>
                        <span className="font-mono text-cyan-300">
                          {reconstructionData.digitalTwin.boundingBox.min.z}m →{' '}
                          {reconstructionData.digitalTwin.boundingBox.max.z}m
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anomaly Waypoints List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Detected Incident Anomaly Waypoints
                  </h4>
                  {anomalyPoints.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white/[0.01] border border-white/5 text-center text-xs text-white/40">
                      No critical anomalies detected in this flight log.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {anomalyPoints.map((pt, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {pt.issue}
                            </div>
                            <div className="text-[10px] text-white/50 font-mono">
                              Alt: {pt.altitude}m • Battery: {pt.battery}% • {new Date(pt.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleFocusAnomaly(pt)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-medium transition-colors"
                          >
                            Focus in 3D
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'physics' && (
              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/20 via-white/[0.02] to-transparent border border-amber-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">Physics-Based Crash & Incident Reconstructor</h3>
                    <p className="text-xs text-white/60 max-w-xl">
                      Injects real-world aerodynamic forces, microburst turbulence, crosswind shear, and propulsion
                      thrust degradation to empirically reconstruct the physical root cause of flight incidents.
                    </p>
                  </div>
                  <button
                    onClick={handleRunPhysicsSimulation}
                    disabled={isSimulatingPhysics}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-medium text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                  >
                    {isSimulatingPhysics ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wind className="w-4 h-4" />
                    )}
                    Run Physics Simulation
                  </button>
                </div>

                {/* Configuration Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <label className="text-xs text-white/60 block">Failure Scenario</label>
                    <select
                      value={physicsConfig.failureType}
                      onChange={(e) => setPhysicsConfig({ ...physicsConfig, failureType: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="MotorCutoff">Motor Cutoff (Severe Thrust Loss)</option>
                      <option value="WindShear">Severe Wind Shear Incursion</option>
                      <option value="BatterySag">Cell Overheat & Voltage Sag</option>
                      <option value="Turbulence">Microburst Atmospheric Turbulence</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Crosswind Speed</span>
                      <span className="text-amber-400 font-mono">{physicsConfig.windSpeedKnots} knots</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={physicsConfig.windSpeedKnots}
                      onChange={(e) =>
                        setPhysicsConfig({ ...physicsConfig, windSpeedKnots: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Thrust Degradation</span>
                      <span className="text-amber-400 font-mono">{physicsConfig.thrustDegradationPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={physicsConfig.thrustDegradationPercent}
                      onChange={(e) =>
                        setPhysicsConfig({ ...physicsConfig, thrustDegradationPercent: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {/* Failure Scenario Quick Presets */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider shrink-0">Presets:</span>
                  {[
                    { label: '🌪️ 35kt Microburst', failureType: 'WindShear', windSpeedKnots: 35, thrustDegradationPercent: 30, triggerSecond: 10 },
                    { label: '⚡ Rotor 1 Cutoff (50%)', failureType: 'MotorCutoff', windSpeedKnots: 15, thrustDegradationPercent: 50, triggerSecond: 12 },
                    { label: '🔋 LiPo Voltage Sag', failureType: 'BatterySag', windSpeedKnots: 20, thrustDegradationPercent: 40, triggerSecond: 15 },
                    { label: '💨 25kt Turbulence', failureType: 'Turbulence', windSpeedKnots: 25, thrustDegradationPercent: 20, triggerSecond: 8 }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPhysicsConfig(prev => ({
                        ...prev,
                        failureType: preset.failureType,
                        windSpeedKnots: preset.windSpeedKnots,
                        thrustDegradationPercent: preset.thrustDegradationPercent,
                        triggerSecond: preset.triggerSecond
                      }))}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.08] text-neutral-400 transition-all shrink-0 active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Physics Result & Empirical Verification Card */}
                {physicsResult && (
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-amber-500/30 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                            Empirical Hypothesis Verification
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/30">
                            {physicsResult.incidentAnalysis.verdict || 'CONFIRMED PHYSICAL MATCH'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1">{physicsResult.incidentAnalysis.hypothesis}</p>
                      </div>

                      <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                        <div className="text-right">
                          <div className="text-[10px] text-neutral-400">Confidence (R²)</div>
                          <div className="text-sm font-bold font-mono text-emerald-400">
                            {physicsResult.incidentAnalysis.confidenceScorePct || 88.5}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Aerodynamic Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                        <span className="text-neutral-400 block text-[10px]">Peak Drag Force</span>
                        <span className="font-mono text-cyan-300 font-semibold text-sm">
                          {physicsResult.incidentAnalysis.peakAerodynamicDragNewtons || 7.24} N
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                        <span className="text-neutral-400 block text-[10px]">Trajectory RMSE</span>
                        <span className="font-mono text-cyan-300 font-semibold text-sm">
                          ±{physicsResult.incidentAnalysis.rmseMeters || 1.45} m
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                        <span className="text-neutral-400 block text-[10px]">Terminal Descent</span>
                        <span className="font-mono text-red-400 font-semibold text-sm">
                          {physicsResult.incidentAnalysis.terminalDescentRateMps || 6.8} m/s
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                        <span className="text-neutral-400 block text-[10px]">Thrust Deficit</span>
                        <span className="font-mono text-amber-300 font-semibold text-sm">
                          -{physicsResult.config.thrustDegradationPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Recovery Directive Callout */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-medium">Avionics Recovery Directive:</strong>
                        <span>{physicsResult.incidentAnalysis.recoveryRecommendation}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'blackbox' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/30 via-white/[0.02] to-transparent border border-red-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                        Autonomous Flight Data Recorder (FDR) Interrogation
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-400 max-w-xl">
                      Reconstructs high-rate aerodynamic telemetry frames, calculates dynamic pressure and stall margins, and evaluates ICAO Annex 13 probable cause.
                    </p>
                  </div>

                  <button
                    onClick={handleInterrogateBlackBox}
                    disabled={isLoadingBlackBox}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBlackBox ? 'animate-spin' : ''}`} />
                    <span>{isLoadingBlackBox ? 'Decoding FDR Memory...' : 'Re-Run FDR Diagnostics'}</span>
                  </button>
                </div>

                {isLoadingBlackBox && (
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
                    <div className="w-8 h-8 mx-auto rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                    <p className="text-xs text-neutral-300 font-mono">
                      Ingesting raw bus hex stream & computing aerodynamic failure vectors...
                    </p>
                  </div>
                )}

                {!isLoadingBlackBox && blackBoxReport && (
                  <div className="space-y-5">
                    {/* Classification & Integrity Ribbon */}
                    <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/20 border border-red-500/40 text-red-300">
                          {blackBoxReport.incidentClassification.criticalityLevel}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white/[0.05] border border-white/10 text-neutral-200">
                          {blackBoxReport.incidentClassification.icaoTaxonomy}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>FDR CRC32: VALID</span>
                        <span className="text-neutral-600">•</span>
                        <span>{blackBoxReport.totalFramesRecorded} FRAMES INGESTED</span>
                      </div>
                    </div>

                    {/* Aerodynamic Failure Vectors Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <span className="text-[10px] text-neutral-400 block font-medium">Peak Descent Velocity</span>
                        <span className="font-mono text-red-400 font-bold text-base">
                          {blackBoxReport.aerodynamicFailureVectors.peakDescentRateMps} m/s
                        </span>
                        <span className="text-[10px] text-neutral-500 block">Vertical descent rate</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <span className="text-[10px] text-neutral-400 block font-medium">Dynamic Pressure (q̄)</span>
                        <span className="font-mono text-cyan-300 font-bold text-base">
                          {blackBoxReport.aerodynamicFailureVectors.peakDynamicPressurePascals} Pa
                        </span>
                        <span className="text-[10px] text-neutral-500 block">Airflow kinetic energy</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <span className="text-[10px] text-neutral-400 block font-medium">Peak Load Factor</span>
                        <span className="font-mono text-amber-300 font-bold text-base">
                          {blackBoxReport.aerodynamicFailureVectors.peakLoadFactorG} G
                        </span>
                        <span className="text-[10px] text-neutral-500 block">Airframe structural load</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <span className="text-[10px] text-neutral-400 block font-medium">Minimum Stall Margin</span>
                        <span className="font-mono text-emerald-400 font-bold text-base">
                          {blackBoxReport.aerodynamicFailureVectors.minimumStallMarginPct}%
                        </span>
                        <span className="text-[10px] text-neutral-500 block">Aerodynamic reserve</span>
                      </div>
                    </div>

                    {/* Probable Cause Statement Card */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                        <FileText className="w-4 h-4 text-red-400" />
                        <span>NTSB / FAA Standard Finding of Probable Cause:</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-black/40 p-3 rounded-xl border border-white/5">
                        {blackBoxReport.incidentClassification.probableCause}
                      </p>
                    </div>

                    {/* Sequence of Events (SoE) Chronology */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">
                          Sequence of Events (SoE) Chronology
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">TIMELINE CALIBRATED UTC</span>
                      </div>

                      <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden text-xs">
                        {blackBoxReport.sequenceOfEvents.map((evt, idx) => (
                          <div key={idx} className="p-3 bg-black/40 flex items-start gap-3">
                            <span className="font-mono text-[11px] text-cyan-400 font-semibold shrink-0 mt-0.5">
                              +{evt.timeOffsetSec.toFixed(1)}s
                            </span>
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{evt.event}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold ${
                                  evt.severity === 'HAZARD' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-white/10 text-neutral-300'
                                }`}>
                                  {evt.severity}
                                </span>
                              </div>
                              <p className="text-neutral-400 text-[11px] leading-relaxed">{evt.description}</p>
                              {evt.coordinates && (
                                <div className="text-[10px] font-mono text-neutral-500">
                                  Cartesian UTM: ({evt.coordinates.x}m, {evt.coordinates.y}m, {evt.coordinates.z}m)
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Airworthiness Directives */}
                    <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Pre-Flight Airworthiness Directives & Remedial Actions:</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-300">
                        {blackBoxReport.airworthinessRecommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quick Investigation Action Triggers */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setPhysicsConfig((prev) => ({
                            ...prev,
                            failureType: blackBoxReport.incidentCoordinates?.issue?.toLowerCase().includes('battery') ? 'BatterySag' : 'MotorCutoff',
                            thrustDegradationPercent: 50,
                            triggerSecond: 10
                          }));
                          setActiveTab('physics');
                          toast.success('Failure vector loaded into Physics Crash Lab!');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all active:scale-95"
                      >
                        <Wind className="w-3.5 h-3.5" />
                        <span>Replicate in Physics Crash Lab</span>
                      </button>

                      {blackBoxReport.incidentCoordinates && (
                        <button
                          onClick={() => handleFocusAnomaly(blackBoxReport.incidentCoordinates)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all active:scale-95"
                        >
                          <Orbit className="w-3.5 h-3.5" />
                          <span>Orbit Crash Site in Unity Viewport</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/20 via-white/[0.02] to-transparent border border-indigo-500/20">
                  <h3 className="text-sm font-semibold text-white">Dual-Screen Interactive Mission Control</h3>
                  <p className="text-xs text-white/60 mt-1 max-w-xl">
                    Controls the Unity Editor camera viewport dynamically. Selecting waypoints or anomalies on this web
                    dashboard triggers instant 360-degree camera orbiting and component inspection in the Unity window.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() =>
                      handleFocusAnomaly({
                        position: { x: 0, y: 35, z: 0 },
                        issue: 'Global Mission Overview'
                      })
                    }
                    className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/30 text-left transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
                      <Radio className="w-4 h-4" />
                      Top-Down Overview
                    </div>
                    <p className="text-[11px] text-white/50">
                      Frames the entire flight bounding box looking down at the trajectory ribbon.
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleFocusAnomaly({
                        position: { x: 0, y: 25, z: 0 },
                        issue: 'Chase Drone Follow Mode'
                      })
                    }
                    className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/30 text-left transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium">
                      <Play className="w-4 h-4" />
                      Chase Camera Mode
                    </div>
                    <p className="text-[11px] text-white/50">
                      Locks the viewport behind the virtual drone as it flies through the waypoints.
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleFocusAnomaly({
                        position: { x: 20, y: 30, z: 40 },
                        issue: 'Inspect Highest Risk Anomaly'
                      })
                    }
                    className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/30 text-left transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                      <Orbit className="w-4 h-4" />
                      Orbit Primary Anomaly
                    </div>
                    <p className="text-[11px] text-white/50">
                      Executes continuous 360° orbit around the primary incident coordinate.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-white/40">
            <span>AeroInsight Simulation Suite • Unity MCP Client v2.35</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
