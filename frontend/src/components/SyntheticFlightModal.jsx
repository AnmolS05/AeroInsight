/**
 * @file SyntheticFlightModal.jsx
 * @description Modal allowing users to generate synthetic drone flight logs
 * with simulated anomalies (Concept 3: Synthetic Telemetry Generator).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, PlaneTakeoff, AlertTriangle, Play, RefreshCw, 
  Compass, Sun, Wind, Radio, Activity, Gauge, BatteryCharging, Zap,
  Users, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Inspection flight pattern definitions with technical metadata.
 */
const PATTERNS = [
  {
    id: 'SolarArrayInspection',
    label: 'Solar Array Photovoltaic Raster',
    description: 'High-density serpentine raster sweep over solar panel arrays',
    defaultAlt: 25,
    icon: Sun,
    badge: 'PV Audit'
  },
  {
    id: 'WindTurbineInspection',
    label: 'Wind Turbine Helical Ascent',
    description: 'Helical orbital climbing scan around turbine mast and blade radius',
    defaultAlt: 40,
    icon: Wind,
    badge: 'Clean Energy'
  },
  {
    id: 'CellTowerInspection',
    label: 'Cell Tower 3-Tiered Cylindrical Scan',
    description: 'Multi-tiered vertical spiral inspection around telecommunication mast',
    defaultAlt: 30,
    icon: Radio,
    badge: 'Telecom'
  },
  {
    id: 'LawnmowerSurvey',
    label: 'Lawnmower Agricultural Grid',
    description: 'Orthogonal grid sweeps with consistent swath overlap',
    defaultAlt: 45,
    icon: Compass,
    badge: 'Mapping'
  },
  {
    id: 'OrbitInspection',
    label: 'Circular 360° Structure Orbit',
    description: 'Constant-radius circular scan with camera gimbal locked to center',
    defaultAlt: 35,
    icon: RefreshCw,
    badge: 'Structure'
  },
  {
    id: 'PointToPoint',
    label: 'BVLOS Linear Delivery Corridor',
    description: 'Long-range point-to-point transit with simulated crosswind gusts',
    defaultAlt: 50,
    icon: PlaneTakeoff,
    badge: 'Logistics'
  }
];

/**
 * 1-Click Scenario Presets.
 */
const PRESETS = [
  {
    name: '☀️ Solar Hotspot',
    pattern: 'SolarArrayInspection',
    anomaly: 'Sudden Altitude Drop',
    altitude: 25,
    duration: 60,
    onsetPct: 60
  },
  {
    name: '🌬️ Turbine Flutter',
    pattern: 'WindTurbineInspection',
    anomaly: 'Motor Overheat',
    altitude: 40,
    duration: 70,
    onsetPct: 55
  },
  {
    name: '📡 RF Compass Drift',
    pattern: 'CellTowerInspection',
    anomaly: 'Sensor Drift',
    altitude: 30,
    duration: 60,
    onsetPct: 50
  },
  {
    name: '⚡ LiPo Voltage Sag',
    pattern: 'PointToPoint',
    anomaly: 'Rapid Battery Depletion',
    altitude: 50,
    duration: 80,
    onsetPct: 65
  },
  {
    name: '🛡️ Nominal Survey',
    pattern: 'LawnmowerSurvey',
    anomaly: 'None',
    altitude: 45,
    duration: 60,
    onsetPct: 70
  }
];

/**
 * Synthetic Flight Generator Modal component.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether modal is displayed.
 * @param {Function} props.onClose - Callback to close modal.
 * @param {Function} props.onFlightCreated - Callback invoked with new flight ID when successfully generated.
 * @param {string} props.apiUrl - Base API endpoint.
 * @returns {React.ReactElement|null} The rendered modal component.
 */
export default function SyntheticFlightModal({ isOpen, onClose, onFlightCreated, apiUrl }) {
  const [pattern, setPattern] = useState('SolarArrayInspection');
  const [anomaly, setAnomaly] = useState('Sudden Altitude Drop');
  const [duration, setDuration] = useState(60);
  const [altitude, setAltitude] = useState(30);
  const [onsetPercent, setOnsetPercent] = useState(65);
  const [isGenerating, setIsGenerating] = useState(false);

  // Multi-Drone Swarm Configuration
  const [isSwarmMode, setIsSwarmMode] = useState(false);
  const [swarmCount, setSwarmCount] = useState(2); // 2 or 3
  const [formation, setFormation] = useState('V-Formation');
  const [separationMeters, setSeparationMeters] = useState(25);

  if (!isOpen) return null;

  const activePatternMeta = PATTERNS.find(p => p.id === pattern) || PATTERNS[0];
  const anomalyOnsetSec = Math.round((duration * onsetPercent) / 100);

  const applyPreset = (preset) => {
    setPattern(preset.pattern);
    setAnomaly(preset.anomaly);
    setAltitude(preset.altitude);
    setDuration(preset.duration);
    setOnsetPercent(preset.onsetPct);
    toast.success(`Loaded preset: ${preset.name}`, { duration: 1500 });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const toastId = toast.loading(
      isSwarmMode
        ? `Generating ${swarmCount}-UAV tactical swarm in ${formation}...`
        : 'Executing synthetic flight simulation and ingesting telemetry...'
    );

    try {
      const endpoint = isSwarmMode ? `${apiUrl}/api/unity/generate-swarm` : `${apiUrl}/api/unity/generate-synthetic`;
      const payload = isSwarmMode
        ? {
            flightPattern: pattern,
            injectedAnomaly: anomaly,
            baseAltitudeMeters: altitude,
            totalDurationSeconds: duration,
            anomalyStartSecond: anomalyOnsetSec,
            swarmCount,
            formation,
            separationMeters
          }
        : {
            flightPattern: pattern,
            injectedAnomaly: anomaly,
            baseAltitudeMeters: altitude,
            totalDurationSeconds: duration,
            anomalyStartSecond: anomalyOnsetSec
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          isSwarmMode
            ? `Swarm mission '${json.flightId}' deployed with ${swarmCount} coordinated UAVs!`
            : `Synthetic mission '${json.flightId}' generated successfully!`,
          { id: toastId }
        );
        if (onFlightCreated) {
          onFlightCreated(json.flightId);
        }
        onClose();
      } else {
        toast.error(json.message || 'Generation failed.', { id: toastId });
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-xl bg-[#0d0e14] border border-white/10 rounded-2xl shadow-2xl p-6 text-white space-y-5 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white/95">Synthetic Telemetry Generator</h3>
                <p className="text-xs text-white/50">Concept 3: Multi-Sensor Simulation Engine to Live Fleet Analytics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Scenario Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/70">Quick Scenario Presets</label>
              <span className="text-[10px] text-purple-400/80 uppercase tracking-wider font-mono">1-Click Setup</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/40 text-white/80 hover:text-white transition-all duration-200"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mission Architecture Selector: Single UAV vs Tactical Swarm */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <button
              onClick={() => setIsSwarmMode(false)}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                !isSwarmMode
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <PlaneTakeoff className="w-3.5 h-3.5" />
              <span>Single UAV Mission</span>
            </button>
            <button
              onClick={() => setIsSwarmMode(true)}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                isSwarmMode
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Tactical Swarm / Fleet Mode</span>
            </button>
          </div>

          {/* Swarm Specific Formation Controls */}
          {isSwarmMode && (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-white">Tactical Formation Geometry</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DECONFLICTED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Formation Type */}
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-300">Formation Shape</label>
                  <select
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    className="w-full bg-[#151620] border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="V-Formation">V-Formation (Wedge)</option>
                    <option value="Echelon">Echelon Right</option>
                    <option value="ColumnTrail">Column Trail</option>
                  </select>
                </div>

                {/* UAV Swarm Count */}
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-300">Swarm Fleet Size</label>
                  <select
                    value={swarmCount}
                    onChange={(e) => setSwarmCount(parseInt(e.target.value, 10))}
                    className="w-full bg-[#151620] border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value={2}>2 UAVs (Lead + Wingman)</option>
                    <option value={3}>3 UAVs (Tactical Trio)</option>
                  </select>
                </div>
              </div>

              {/* Separation Distance Slider */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-300">Inter-UAV Separation Target</span>
                  <span className="text-purple-300 font-mono font-semibold">{separationMeters}m</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={separationMeters}
                  onChange={(e) => setSeparationMeters(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Form Options */}
          <div className="space-y-4 text-xs">
            {/* Pattern Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-white/70 font-medium">Industrial Flight Pattern</label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  {activePatternMeta.badge}
                </span>
              </div>
              <select
                value={pattern}
                onChange={(e) => {
                  const newPat = e.target.value;
                  setPattern(newPat);
                  const meta = PATTERNS.find(p => p.id === newPat);
                  if (meta) setAltitude(meta.defaultAlt);
                }}
                className="w-full bg-[#151620] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400 transition-colors"
              >
                {PATTERNS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#151620] text-white">
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-white/45 italic">{activePatternMeta.description}</p>
            </div>

            {/* Injected Anomaly */}
            <div className="space-y-1.5">
              <label className="text-white/70 font-medium">Simulated Anomaly / Edge Case</label>
              <select
                value={anomaly}
                onChange={(e) => setAnomaly(e.target.value)}
                className="w-full bg-[#151620] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400 transition-colors"
              >
                <option value="Sudden Altitude Drop" className="bg-[#151620]">Sudden Altitude Loss / Microburst Downdraft</option>
                <option value="Motor Overheat" className="bg-[#151620]">Motor Rotor Temperature Overheat Warning</option>
                <option value="Rapid Battery Depletion" className="bg-[#151620]">Critical LiPo Cell Voltage Sag</option>
                <option value="Sensor Drift" className="bg-[#151620]">Compass & GNSS Sensor Drift (RF Interference)</option>
                <option value="None" className="bg-[#151620]">Nominal Mission (Zero Anomalies / Safety Baseline)</option>
              </select>
            </div>

            {/* Parameter Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Duration Slider */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-[11px]">Flight Duration</span>
                  <span className="text-purple-300 font-mono font-medium">{duration}s</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="180"
                  step="10"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Altitude Slider */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-[11px]">Base Flight Altitude</span>
                  <span className="text-purple-300 font-mono font-medium">{altitude}m AGL</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={altitude}
                  onChange={(e) => setAltitude(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Anomaly Onset Timing */}
            {anomaly !== 'None' && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-amber-300/80 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Anomaly Inception Time
                  </span>
                  <span className="text-amber-300 font-mono font-medium">
                    T+{anomalyOnsetSec}s ({onsetPercent}% of flight)
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="85"
                  step="5"
                  value={onsetPercent}
                  onChange={(e) => setOnsetPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-amber-900/30 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Simulation Telemetry Profile Preview */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider">Waypoints</div>
                <div className="text-sm font-semibold font-mono text-purple-300">{duration} pts</div>
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider">Sampling Rate</div>
                <div className="text-sm font-semibold font-mono text-cyan-300">1.0 Hz</div>
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider">Sensors</div>
                <div className="text-sm font-semibold font-mono text-emerald-300">5 Streams</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all duration-200"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate & Ingest Mission
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
