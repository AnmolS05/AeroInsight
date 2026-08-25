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
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
            <PlaneTakeoff size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">AeroInsight</h1>
            <p className="text-xs text-brand-600 font-medium">Drone Telemetry AI</p>
          </div>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-sm disabled:opacity-70"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Upload size={18} />
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
          <Clock size={14} />
          Recent Flights
        </h3>
        
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search flights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          {filteredFlights.length === 0 ? (
            <div className="text-sm text-slate-500 text-center p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50">
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
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      isSelected 
                      ? 'bg-brand-50 border-brand-200 shadow-[0_2px_12px_rgba(37,99,235,0.06)]' 
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1 pr-6">
                      <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-brand-700' : 'text-slate-600'}`}>
                        FLT-{flight.id.substring(0, 6).toUpperCase()}
                      </span>
                      {isSelected && <Activity size={14} className="text-brand-500 animate-pulse" />}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <span>{date}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
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
      
      <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
        Powered by Gemini AI
      </div>
    </aside>
  );
}
