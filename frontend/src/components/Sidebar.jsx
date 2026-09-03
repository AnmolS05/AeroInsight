import React, { useRef, useState } from 'react';
import { Upload, PlaneTakeoff, Clock, Activity, Search, Trash2, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { parseFlightLog } from '../utils/flightParser';

export default function Sidebar({ flights, onSelect, selectedId, onUploadSuccess, onDelete, apiUrl }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFlights = flights.filter(f => f.id.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading and analyzing flight log...');

    try {
      const jsonData = await parseFlightLog(file);
      
      const res = await fetch(`${apiUrl}/api/flights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });

      if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
      
      toast.success('Flight log analyzed successfully!', { id: toastId });
      onUploadSuccess();
    } catch (err) {
      toast.error('Failed to parse or upload data. Ensure it matches the required format.', { id: toastId });
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-[340px] bg-[#0b1120]/80 backdrop-blur-2xl border-r border-indigo-500/20 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="p-8 border-b border-indigo-500/20 bg-[#0a0f1c]/50 relative z-10 shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/30 group hover:bg-indigo-500/20 transition-colors">
            <PlaneTakeoff size={28} className="stroke-[2.5] group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">AeroInsight</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" /> Telemetry AI
            </p>
          </div>
        </motion.div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] disabled:opacity-70 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
          ) : (
            <div className="flex items-center gap-3 relative z-10">
              <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />
              Upload Flight Log
            </div>
          )}
        </motion.button>
        <input 
          type="file" 
          accept=".json,.csv" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload} 
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10 flex flex-col gap-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/70" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0f1c]/80 backdrop-blur-md border border-indigo-500/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all font-medium shadow-inner"
          />
        </div>
        
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2 drop-shadow-md">
            <Clock size={14} className="text-indigo-400" />
            Recent Logs
          </h3>
          
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filteredFlights.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-xs text-slate-500 font-bold text-center p-8 border border-indigo-500/10 rounded-2xl bg-[#0a0f1c]/50 flex flex-col items-center gap-3"
                >
                  <LayoutDashboard size={24} className="text-indigo-500/30" />
                  {searchQuery ? "No matching flights." : "No flight logs found."}
                </motion.div>
              ) : (
                filteredFlights.map((flight, i) => {
                  const isSelected = selectedId === flight.id;
                  const date = new Date(flight.created_at).toLocaleDateString(undefined, { 
                    month: 'short', day: 'numeric' 
                  });
                  const time = new Date(flight.created_at).toLocaleTimeString(undefined, { 
                    hour: '2-digit', minute: '2-digit' 
                  });

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      key={flight.id} 
                      className="group relative flex items-center"
                    >
                      <button
                        onClick={() => onSelect(flight.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                          isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                          : 'bg-[#0a0f1c]/50 border-indigo-500/10 hover:border-indigo-500/30 hover:bg-indigo-500/5'
                        }`}
                      >
                        {isSelected && (
                          <motion.div 
                            layoutId="activeIndicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"
                          />
                        )}
                        <div className="flex items-start justify-between mb-2 pr-8 pl-1">
                          <span className={`font-mono text-xs font-black uppercase tracking-widest ${isSelected ? 'text-indigo-400 drop-shadow-md' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                            FLT-{flight.id.substring(0, 6).toUpperCase()}
                          </span>
                          {isSelected && <Activity size={16} className="text-indigo-400 animate-pulse drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold flex items-center gap-2 pl-1">
                          <span>{date}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span>{time}</span>
                        </div>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this flight log?')) {
                            onDelete(flight.id);
                          }
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10 border border-transparent hover:border-rose-500/20"
                        title="Delete flight"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <div className="p-5 border-t border-indigo-500/20 bg-[#0a0f1c]/80 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center relative z-10 flex items-center justify-center gap-2 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
        Powered by Gemini AI
      </div>
    </aside>
  );
}
