/**
 * @file SyntheticFlightModal.jsx
 * @description Modal allowing users to generate synthetic drone flight logs
 * with simulated anomalies (Concept 3: Synthetic Telemetry Generator).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, PlaneTakeoff, AlertTriangle, Play, RefreshCw, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [pattern, setPattern] = useState('LawnmowerSurvey');
  const [anomaly, setAnomaly] = useState('Motor Overheat');
  const [duration, setDuration] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Simulating flight and generating telemetry...');

    try {
      const res = await fetch(`${apiUrl}/api/unity/generate-synthetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightPattern: pattern,
          injectedAnomaly: anomaly,
          totalDurationSeconds: duration,
          anomalyStartSecond: Math.floor(duration * 0.65)
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Synthetic mission '${json.flightId}' created!`, { id: toastId });
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg bg-[#0e0f15] border border-white/10 rounded-2xl shadow-2xl p-6 text-white space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Synthetic Telemetry Generator</h3>
                <p className="text-xs text-white/50">Simulation Engine to Fleet Dashboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Options */}
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-white/60">Flight Inspection Pattern</label>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="LawnmowerSurvey">Lawnmower Array Survey (Grid sweep)</option>
                <option value="OrbitInspection">Circular Orbit Inspection (360° structure sweep)</option>
                <option value="PointToPoint">Point-to-Point Long Range Delivery</option>
                <option value="PerimeterPatrol">Perimeter Security Patrol</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-white/60">Injected Failure Scenario</label>
              <select
                value={anomaly}
                onChange={(e) => setAnomaly(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="Motor Overheat">Motor Temperature Overheat Warning</option>
                <option value="Rapid Battery Depletion">Critical Battery Voltage Sag</option>
                <option value="Sudden Altitude Drop">Sudden Altitude Loss / Microburst</option>
                <option value="Sensor Drift">Compass & GPS Sensor Drift</option>
                <option value="None">Nominal Flight (Zero Anomalies)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-white/60">Simulation Duration</label>
                <span className="text-purple-300 font-mono">{duration} seconds</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                step="10"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full accent-purple-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate & Persist Mission
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
