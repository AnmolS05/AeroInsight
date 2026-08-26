import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import ReportViewer from './components/ReportViewer';
import TelemetryChart from './components/TelemetryChart';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import ReportModal from './components/ReportModal';
import { Maximize2, X } from 'lucide-react';

function App() {
  const [flights, setFlights] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [flightData, setFlightData] = useState([]);
  const [reportText, setReportText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportFullscreen, setIsReportFullscreen] = useState(false);

  const API_BASE_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000');

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/flights`);
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setFlights(data);
      } else {
        setFlights([]);
      }
    } catch (err) {
      console.error('Failed to fetch flights:', err);
    }
  };

  const handleFlightSelect = async (id) => {
    setSelectedFlightId(id);
    setIsLoading(true);
    setFlightData([]);
    setReportText(null);

    try {
      const dataRes = await fetch(`${API_BASE_URL}/api/flights/${id}`);
      if (!dataRes.ok) throw new Error(`API Error: ${dataRes.status}`);
      const data = await dataRes.json();
      if (Array.isArray(data)) {
        setFlightData(data);
      } else {
        setFlightData([]);
      }

      const reportRes = await fetch(`${API_BASE_URL}/api/flights/${id}/report`);
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setReportText(reportData.report);
      }
    } catch (err) {
      console.error('Failed to load flight details:', err);
      toast.error('Failed to load flight details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchFlights();
  };

  const handleFlightDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/flights/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Flight deleted successfully');
        if (selectedFlightId === id) {
          setSelectedFlightId(null);
          setFlightData([]);
          setReportText(null);
        }
        fetchFlights();
      } else {
        toast.error('Failed to delete flight');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete flight');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0f1c] overflow-hidden text-slate-200">
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(11, 17, 32, 0.9)',
            backdropFilter: 'blur(16px)',
            color: '#fff',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '1rem',
            padding: '16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
            style: { border: '1px solid rgba(16, 185, 129, 0.3)' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            style: { border: '1px solid rgba(239, 68, 68, 0.3)' }
          }
        }} 
      />
      <Sidebar 
        flights={flights} 
        onSelect={handleFlightSelect} 
        selectedId={selectedFlightId} 
        onUploadSuccess={handleUploadSuccess}
        onDelete={handleFlightDelete}
        apiUrl={API_BASE_URL}
      />
      
      <main className="flex-1 flex flex-col p-6 gap-6 h-full overflow-hidden relative z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="bg-[#0b1120]/80 backdrop-blur-3xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 border border-indigo-500/20 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">AeroInsight Dashboard</h1>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" /> Select a flight log to view telemetry and AI analysis
            </p>
          </div>
          {selectedFlightId && (
            <div className="px-5 py-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl text-sm font-black tracking-widest uppercase border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2 relative z-10">
              Flight ID <span className="text-white drop-shadow-md">{selectedFlightId.split('-')[0]}</span>
            </div>
          )}
        </header>

        <div className="flex-1 flex flex-col gap-4 h-[calc(100%-80px)]">
          <ErrorBoundary>
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-indigo-500/20 rounded-[2.5rem] bg-[#0b1120]/50 backdrop-blur-xl m-4 shadow-inner">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
              <p className="text-indigo-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading telemetry data...</p>
            </div>
          ) : flightData.length > 0 ? (
            <>
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-3 gap-6 shrink-0 relative z-10"
              >
                {/* Metric Card 1 */}
                <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-blue-500/20 p-6 flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Flight Duration
                  </span>
                  <span className="text-4xl font-black text-white drop-shadow-md relative z-10">
                    {(() => {
                      if (!flightData || flightData.length < 2) return '0s';
                      const start = new Date(flightData[0].timestamp).getTime();
                      const end = new Date(flightData[flightData.length - 1].timestamp).getTime();
                      const diffS = Math.abs(end - start) / 1000;
                      if (diffS < 60) return `${Math.floor(diffS)}s`;
                      const min = Math.floor(diffS / 60);
                      return `${min}m ${Math.floor(diffS % 60)}s`;
                    })()}
                  </span>
                </div>
                {/* Metric Card 2 */}
                <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-indigo-500/20 p-6 flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Max Altitude
                  </span>
                  <span className="text-4xl font-black text-white drop-shadow-md relative z-10 flex items-baseline">
                    {Math.max(...flightData.map(d => d.altitude))}
                    <span className="text-lg text-indigo-400 ml-1">m</span>
                  </span>
                </div>
                {/* Metric Card 3 */}
                <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-emerald-500/20 p-6 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)] transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Final Battery
                  </span>
                  <span className="text-4xl font-black text-white drop-shadow-md relative z-10 flex items-baseline">
                    {flightData[flightData.length - 1].battery}
                    <span className="text-lg text-emerald-400 ml-1">%</span>
                  </span>
                </div>
              </motion.div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 relative z-10">
                <motion.section 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-indigo-500/20 p-3 overflow-hidden flex flex-col h-full group hover:border-indigo-500/40 transition-all duration-500"
                >
                  <h2 className="text-sm font-black text-white px-4 pt-3 pb-4 flex items-center gap-3 tracking-widest uppercase drop-shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                    Flight Path Map
                  </h2>
                  <div className="flex-1 rounded-[1.5rem] overflow-hidden border border-indigo-500/10 bg-[#0a0f1c] relative">
                    <Map telemetryData={flightData} />
                  </div>
                </motion.section>
                
                <motion.section 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-purple-500/20 p-6 overflow-hidden flex flex-col h-full group hover:border-purple-500/40 transition-all duration-500 relative"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                  <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 mb-4 relative z-10">
                    <h2 className="text-sm font-black text-white flex items-center gap-3 tracking-widest uppercase drop-shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse"></span>
                      AI Analysis Report
                    </h2>
                    <button 
                      onClick={() => setIsReportFullscreen(true)}
                      className="text-slate-400 hover:text-white transition-colors p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 hover:bg-purple-500/30"
                      title="View Fullscreen"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar relative z-10">
                    {reportText ? (
                      <ReportViewer markdown={reportText} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-purple-400/50 font-black tracking-widest uppercase text-xs animate-pulse">
                        <p>Generating AI Intelligence...</p>
                      </div>
                    )}
                  </div>
                </motion.section>
              </div>
              
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-blue-500/20 p-6 shrink-0 h-72 flex flex-col group hover:border-blue-500/40 transition-all duration-500 relative z-10 overflow-hidden"
              >
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                <h2 className="text-sm font-black text-white pb-4 flex items-center gap-3 tracking-widest uppercase drop-shadow-md relative z-10">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                  Telemetry Analytics
                </h2>
                <div className="flex-1 min-h-0 relative z-10">
                  <TelemetryChart data={flightData} />
                </div>
              </motion.section>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center border border-indigo-500/20 rounded-[3rem] bg-[#0b1120]/60 backdrop-blur-3xl m-6 shadow-inner relative overflow-hidden"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-indigo-500/20 relative z-10 hover:scale-110 hover:bg-indigo-500/20 transition-all duration-500 cursor-default">
                <svg className="w-12 h-12 text-indigo-400 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight drop-shadow-md relative z-10">Welcome to AeroInsight</h2>
              <p className="text-slate-400 max-w-md text-center text-sm font-medium leading-relaxed relative z-10">
                Select a flight log from the sidebar to view its telemetry, interactive map, and Gemini-powered intelligence report.
              </p>
            </motion.div>
          )}
          </ErrorBoundary>
        </div>
      </main>

      {/* Fullscreen Report Modal */}
      <AnimatePresence>
        {isReportFullscreen && (
          <ReportModal 
            isOpen={isReportFullscreen} 
            onClose={() => setIsReportFullscreen(false)} 
            reportText={reportText} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
