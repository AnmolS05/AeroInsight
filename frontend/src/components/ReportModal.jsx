/**
 * @file ReportModal.jsx
 * @description Apple-inspired clean fullscreen modal for reading comprehensive mission intelligence reports.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import ReportViewer from './ReportViewer';

/**
 * Fullscreen modal wrapper for the AI safety and anomaly intelligence report.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether modal is active.
 * @param {Function} props.onClose - Dismiss modal handler.
 * @param {string|null} props.reportText - Markdown string of the mission brief.
 * @param {Function} [props.onRefresh] - Callback to regenerate report.
 * @param {boolean} [props.isRegenerating=false] - Whether AI engine is processing.
 * @returns {React.ReactElement|null} The rendered modal or null.
 */
function ReportModal({ isOpen, onClose, reportText, onRefresh, isRegenerating = false }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Mission Intelligence Report">
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
        className="relative w-full max-w-4xl h-[85vh] bg-[#111113] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141417]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Mission Intelligence Report</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">Automated telemetry evaluation & anomaly analysis</p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRegenerating}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                title="Regenerate Report"
                aria-label="Regenerate report"
              >
                <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-[#0a0a0c]">
          {isRegenerating ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <div className="w-6 h-6 border-2 border-white/20 border-t-[#2997ff] rounded-full animate-spin" />
              <p className="text-xs font-medium">Generating new intelligence brief...</p>
            </div>
          ) : reportText ? (
            <ReportViewer markdown={reportText} />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
              <p className="text-xs font-medium">No report generated for this flight log.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ReportModal;
