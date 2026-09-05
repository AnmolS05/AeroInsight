/**
 * @file Sidebar.jsx
 * @description Clean, restrained Apple-inspired flight log navigation sidebar.
 * Supports file uploads, local search filtering, flight selection, and responsive mobile drawers.
 */

import React, { useRef, useState } from 'react';
import { Upload, PlaneTakeoff, Clock, Activity, Search, Trash2, X, Compass, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { parseFlightLog } from '../utils/flightParser';

/**
 * Sidebar component providing flight log navigation, file upload handling, and sample mission selection.
 *
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.flights - List of flight records.
 * @param {Function} props.onSelect - Callback invoked with selected flight ID.
 * @param {string|null} props.selectedId - Currently selected flight ID.
 * @param {Function} props.onUploadSuccess - Callback invoked after a flight log is uploaded or parsed.
 * @param {Function} props.onDelete - Callback invoked to delete a flight log.
 * @param {string} props.apiUrl - Base API endpoint.
 * @param {boolean} [props.isMobileOpen=false] - Whether sidebar is open on mobile viewports.
 * @param {Function} [props.onMobileClose] - Callback to dismiss the sidebar on mobile.
 * @param {Function} [props.onSelectSample] - Optional callback to load sample missions directly.
 * @returns {React.ReactElement} The rendered Sidebar component.
 */
export default function Sidebar({
  flights,
  onSelect,
  selectedId,
  onUploadSuccess,
  onDelete,
  apiUrl,
  isMobileOpen = false,
  onMobileClose,
  onSelectSample
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFlights = flights.filter(f => {
    const query = searchQuery.toLowerCase();
    const idMatches = f.id?.toLowerCase().includes(query);
    const nameMatches = f.name?.toLowerCase().includes(query);
    return idMatches || nameMatches;
  });

  /**
   * Handles user file selection and dispatches parsed JSON to the server or local state.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event.
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Parsing telemetry log...');

    try {
      const jsonData = await parseFlightLog(file);

      // Attempt server sync
      try {
        const res = await fetch(`${apiUrl}/api/flights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData)
        });

        if (res.ok) {
          toast.success('Flight log uploaded & analyzed', { id: toastId });
          onUploadSuccess();
          if (onMobileClose) onMobileClose();
          return;
        }
      } catch (networkErr) {
        // Fall back gracefully to local visualization
        console.warn('Backend server offline, loading flight locally:', networkErr);
      }

      // Local fallback handler
      toast.success('Flight telemetry loaded locally', { id: toastId });
      onUploadSuccess(jsonData, file.name.replace(/\.[^/.]+$/, ""));
      if (onMobileClose) onMobileClose();
    } catch (err) {
      toast.error('Invalid flight log format. Requires CSV or JSON telemetry array.', { id: toastId });
      console.error('File parse error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0a0c] border-r border-white/[0.08] select-none">
      {/* Header & Logo */}
      <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group/logo">
            <div className="absolute -inset-1 bg-[#2997ff]/20 rounded-2xl blur-sm opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300" />
            <img
              src="/brand-emblem.png"
              alt="AeroInsight Logo"
              className="relative w-9 h-9 rounded-xl object-cover border border-white/[0.12] shadow-sm"
            />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight leading-none">AeroInsight</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse"></span>
              <span className="text-[11px] font-medium text-neutral-400">Flight System</span>
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Primary Actions */}
      <div className="p-4 flex flex-col gap-2.5 border-b border-white/[0.06]">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="apple-btn-primary w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-xs tracking-wide shadow-sm disabled:opacity-60 group"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={14} className="stroke-[2.5] group-hover:-translate-y-0.5 transition-transform duration-200" />
              <span>Upload Flight Log</span>
            </>
          )}
        </button>
        <input
          type="file"
          accept=".json,.csv"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          aria-label="Upload flight telemetry file"
        />
      </div>

      {/* Search Input */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search flights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.14] border border-white/[0.08] focus:border-[#0071e3] focus:bg-white/[0.07] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Flight Logs List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 flex flex-col gap-1.5" role="navigation" aria-label="Flight logs navigation">
        <div className="px-3 py-2 flex items-center justify-between text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
          <span>Flight Logs</span>
          <span>{filteredFlights.length}</span>
        </div>

        {filteredFlights.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-neutral-500">
            <Clock size={20} className="stroke-[1.5] mb-2 opacity-50" />
            <p className="text-xs font-medium">{searchQuery ? "No matching flights" : "No logs available"}</p>
            <p className="text-[11px] text-neutral-600 mt-1">Upload a log or load a sample mission</p>
          </div>
        ) : (
          filteredFlights.map((flight) => {
            const isSelected = selectedId === flight.id;
            const dateStr = flight.created_at
              ? new Date(flight.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'Recent';
            const timeStr = flight.created_at
              ? new Date(flight.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={flight.id}
                className="group relative flex items-center"
              >
                <button
                  onClick={() => {
                    onSelect(flight.id);
                    if (onMobileClose) onMobileClose();
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border text-xs transition-all duration-200 flex items-center justify-between group/item ${
                    isSelected
                      ? 'bg-white/[0.08] border-white/[0.14] text-white shadow-sm'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.08] hover:translate-x-0.5'
                  }`}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isSelected ? 'text-white font-semibold' : 'text-neutral-300'}`}>
                        {flight.name || `Flight ${flight.id.substring(0, 8).toUpperCase()}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                      <span>{dateStr}</span>
                      {timeStr && <span>· {timeStr}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff] shadow-[0_0_6px_rgba(41,151,255,0.8)]" />
                    )}
                  </div>
                </button>

                {/* Delete action button */}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(flight.id);
                    }}
                    className="absolute right-2 p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Delete log"
                    aria-label={`Delete flight ${flight.id}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-white/[0.06] text-[11px] text-neutral-500 flex items-center justify-between">
        <span>AeroInsight v2.0</span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          <CheckCircle2 size={12} className="text-[#30d158]" /> Ready
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
