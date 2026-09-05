/**
 * @file MapModal.jsx
 * @description Apple-inspired clean fullscreen modal for inspecting high-resolution flight trajectory maps.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Map from './Map';

/**
 * Fullscreen modal wrapper for the flight path map.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether modal is visible.
 * @param {Function} props.onClose - Modal close handler.
 * @param {Array<Object>} props.telemetryData - Flight telemetry data array.
 * @returns {React.ReactElement|null} The rendered modal or null.
 */
function MapModal({ isOpen, onClose, telemetryData }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none" role="dialog" aria-modal="true" aria-label="Fullscreen map">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl h-[85vh] bg-[#111113] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141417]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Full Trajectory Map</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">High-precision geospatial playback and waypoint inspection</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 bg-[#0a0a0c]">
          <div className="w-full h-full rounded-xl overflow-hidden border border-white/[0.08]">
            <Map telemetryData={telemetryData} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MapModal;
