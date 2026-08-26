import React, { useRef, useState } from 'react';
import { Upload, PlaneTakeoff, Activity, Clock, CheckCircle2, AlertCircle, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

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

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target.result;
        let jsonData;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          const parsed = Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: h => h.trim().toLowerCase()
          });
          // Map data and generate a mock flight path if GPS coordinates are missing
          let currentLat = 37.7749;
          let currentLng = -122.4194;
          
          jsonData = parsed.data.map((row, index) => {
            const alt = row['altitude (meters)'] ?? row.altitude ?? row.alt ?? 0;
            const bat = row['battery remaining (%)'] ?? row.battery ?? row.bat ?? 100;
            const issue = row['notes'] ?? row['obstacles encountered'] ?? row.issue ?? 'none';
            const time = row['flight date'] ?? row.timestamp ?? new Date(Date.now() + index * 60000).toISOString();
            
            let lat = row.latitude ?? row.lat;
            let lng = row.longitude ?? row.lng;
            
            if (lat === undefined || lng === undefined) {
               currentLat += (Math.random() - 0.5) * 0.01;
               currentLng += (Math.random() - 0.5) * 0.01;
               lat = currentLat;
               lng = currentLng;
            }

            return {
              latitude: Number(lat) || 0,
              longitude: Number(lng) || 0,
              altitude: Number(alt) || 0,
              battery: Number(bat) || 0,
              issue: String(issue),
              timestamp: String(time)
            };
          });
        } else {
          jsonData = JSON.parse(fileContent);
        }
        
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
    reader.readAsText(file);
  };

  return (
    <aside className="w-80 bg-[#0b1120]/80 backdrop-blur-2xl border-r border-indigo-500/20 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="p-8 border-b border-indigo-500/20 bg-[#0a0f1c]/50 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-[1rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-indigo-500/30">
            <PlaneTakeoff size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">AeroInsight</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Drone Telemetry AI</p>
          </div>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-[1rem] flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-70 group"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />
              Upload Flight Log
            </>
          )}
        </button>
        <input 
          type="file" 
          accept=".json,.csv" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload} 
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2 drop-shadow-md">
          <Clock size={14} className="text-indigo-400" />
          Recent Flights
        </h3>
        
        <div className="relative mb-6">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            placeholder="Search flights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0f1c] border border-indigo-500/20 rounded-[1rem] pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all font-medium shadow-inner"
          />
        </div>
        
        <div className="flex flex-col gap-3">
          {filteredFlights.length === 0 ? (
            <div className="text-xs text-slate-500 font-bold text-center p-6 border border-indigo-500/10 rounded-[1rem] bg-[#0a0f1c]/50">
              {searchQuery ? "No matching flights found." : "No flight logs found. Upload one to begin."}
            </div>
          ) : (
            filteredFlights.map(flight => {
              const isSelected = selectedId === flight.id;
              const date = new Date(flight.created_at).toLocaleDateString(undefined, { 
                month: 'short', day: 'numeric', year: 'numeric' 
              });
              const time = new Date(flight.created_at).toLocaleTimeString(undefined, { 
                hour: '2-digit', minute: '2-digit' 
              });

              return (
                <div key={flight.id} className="group relative flex items-center">
                  <button
                    onClick={() => onSelect(flight.id)}
                    className={`w-full text-left p-4 rounded-[1rem] border transition-all duration-300 ${
                      isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                      : 'bg-[#0a0f1c]/50 border-indigo-500/10 hover:border-indigo-500/30 hover:bg-indigo-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2 pr-6">
                      <span className={`font-mono text-[11px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-400 drop-shadow-md' : 'text-slate-400'}`}>
                        FLT-{flight.id.substring(0, 6).toUpperCase()}
                      </span>
                      {isSelected && <Activity size={14} className="text-indigo-400 animate-pulse drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-2">
                      <span>{date}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <span>{time}</span>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this flight log?')) {
                        onDelete(flight.id);
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10 border border-transparent hover:border-rose-500/20"
                    title="Delete flight"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="p-5 border-t border-indigo-500/20 bg-[#0a0f1c]/80 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center relative z-10 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
        Powered by Gemini AI
      </div>
    </aside>
  );
}
