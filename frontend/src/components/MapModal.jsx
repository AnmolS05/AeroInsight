import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Map from './Map';

function MapModal({ isOpen, onClose, telemetryData }) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#0a0f1c]/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0b1120] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-indigo-500/30 w-full max-w-6xl h-full max-h-full flex flex-col overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="p-6 border-b border-indigo-500/20 flex items-center justify-between bg-[#0a0f1c]/50 relative z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-3 tracking-widest uppercase drop-shadow-md">
            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse"></span>
            Flight Path Map
          </h2>
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 rounded-xl transition-all duration-300"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>
        </div>
        <div className="p-4 flex-1 relative z-10">
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden border border-indigo-500/20">
            <Map telemetryData={telemetryData} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default MapModal;
