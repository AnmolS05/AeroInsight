import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import ReportViewer from './components/ReportViewer';
import TelemetryChart from './components/TelemetryChart';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
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
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar 
        flights={flights} 
        onSelect={handleFlightSelect} 
        selectedId={selectedFlightId} 
        onUploadSuccess={handleUploadSuccess}
        onDelete={handleFlightDelete}
        apiUrl={API_BASE_URL}
      />
      
      <main className="flex-1 flex flex-col p-4 gap-4 h-full overflow-hidden">
        <header className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Select a flight from the sidebar to view telemetry and AI analysis.</p>
          </div>
          {selectedFlightId && (
            <div className="px-4 py-1.5 bg-brand-50 text-brand-600 rounded-full text-sm font-medium border border-brand-100 shadow-sm">
              Flight ID: <span className="font-mono text-xs">{selectedFlightId.split('-')[0]}</span>
            </div>
          )}
        </header>

        <div className="flex-1 flex flex-col gap-4 h-[calc(100%-80px)]">
          <ErrorBoundary>
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 m-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Loading flight data...</p>
            </div>
          ) : flightData.length > 0 ? (
            <>
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-3 gap-4 shrink-0"
              >
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-center">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Flight Duration</span>
                  <span className="text-2xl font-bold text-slate-800">
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-center">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Max Altitude</span>
                  <span className="text-2xl font-bold text-slate-800">{Math.max(...flightData.map(d => d.altitude))}m</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-center">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Final Battery</span>
                  <span className="text-2xl font-bold text-slate-800">{flightData[flightData.length - 1].battery}%</span>
                </div>
              </motion.div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                <motion.section 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 overflow-hidden flex flex-col h-full"
                >
                  <h2 className="text-lg font-semibold text-slate-700 px-2 pt-2 pb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Flight Path Map
                  </h2>
                  <div className="flex-1 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                    <Map telemetryData={flightData} />
                  </div>
                </motion.section>
                
                <motion.section 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 overflow-hidden flex flex-col h-full"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      Gemini Analysis Report
                    </h2>
                    <button 
                      onClick={() => setIsReportFullscreen(true)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      title="View Fullscreen"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {reportText ? (
                      <ReportViewer markdown={reportText} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        <p>Loading AI report...</p>
                      </div>
                    )}
                  </div>
                </motion.section>
              </div>
              
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 shrink-0 h-72 flex flex-col"
              >
                <h2 className="text-lg font-semibold text-slate-700 pb-3 flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Telemetry Analytics
                </h2>
                <div className="flex-1 min-h-0">
                  <TelemetryChart data={flightData} />
                </div>
              </motion.section>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 m-4"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Welcome to AeroInsight</h2>
              <p className="text-slate-500 max-w-md text-center">
                Select a flight log from the sidebar to view its telemetry, map, and AI-powered analysis, or upload a new flight log to get started.
              </p>
            </motion.div>
          )}
          </ErrorBoundary>
        </div>
      </main>

      {/* Fullscreen Report Modal */}
      {isReportFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                Gemini Analysis Report
              </h2>
              <button 
                onClick={() => setIsReportFullscreen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {reportText ? (
                <ReportViewer markdown={reportText} />
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-400">
                  <p>Loading AI report...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;
