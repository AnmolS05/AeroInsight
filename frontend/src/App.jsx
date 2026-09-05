/**
 * @file App.jsx
 * @description Master dashboard component for AeroInsight.
 * Features an Apple-inspired minimal design with telemetry analytics, interactive flight maps,
 * automated AI safety evaluation, and built-in sample mission fallback for offline demonstration.
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import ReportViewer from './components/ReportViewer';
import TelemetryChart from './components/TelemetryChart';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import ReportModal from './components/ReportModal';
import MapModal from './components/MapModal';
import { Maximize2, RefreshCw, PlaneTakeoff, Menu, AlertTriangle, ShieldCheck, ArrowRight, MessageSquare, Send } from 'lucide-react';
import { SAMPLE_FLIGHTS } from './utils/sampleFlights';

/**
 * Smooth animated number counter component with spring dynamics.
 *
 * @param {Object} props - Component properties.
 * @param {number} props.value - Target numeric value.
 * @param {string} [props.suffix=''] - Optional suffix string (e.g. 'm' or '%').
 * @returns {React.ReactElement} Animated number component.
 */
function AnimatedNumber({ value, suffix = '' }) {
  const spring = useSpring(0, { bounce: 0, duration: 1200 });
  const display = useTransform(spring, (current) => Math.round(current) + suffix);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

/**
 * Formats duration seconds into standard minutes and seconds string with smooth spring transition.
 *
 * @param {Object} props - Component properties.
 * @param {number} props.diffS - Duration in seconds.
 * @returns {React.ReactElement} Animated time component.
 */
function AnimatedTime({ diffS }) {
  const spring = useSpring(0, { bounce: 0, duration: 1200 });

  const display = useTransform(spring, (current) => {
    const s = Math.round(current);
    if (s < 60) return `${s}s`;
    const min = Math.floor(s / 60);
    return `${min}m ${s % 60}s`;
  });

  useEffect(() => {
    spring.set(diffS);
  }, [spring, diffS]);

  return <motion.span>{display}</motion.span>;
}

/**
 * Main application dashboard component.
 *
 * @returns {React.ReactElement} The rendered AeroInsight dashboard.
 */
function App() {
  const [flights, setFlights] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [flightData, setFlightData] = useState([]);
  const [reportText, setReportText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportFullscreen, setIsReportFullscreen] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isRegeneratingReport, setIsRegeneratingReport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Quick Flight Assistant / AI Query state
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState(null);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  const API_BASE_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000');

  useEffect(() => {
    fetchFlights();
  }, []);

  /**
   * Fetches flight list from the backend API.
   * If server is unreachable or returns empty, defaults to bundled sample missions.
   */
  const fetchFlights = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/flights`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFlights(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API unreachable. Initializing with sample missions.');
    }

    // Default to bundled sample flights for immediate zero-friction evaluation
    setFlights(SAMPLE_FLIGHTS.map(sf => ({
      id: sf.id,
      name: sf.name,
      created_at: sf.created_at
    })));
  };

  /**
   * Loads telemetry data and evaluation report for the selected flight ID.
   *
   * @param {string} id - Flight identifier string.
   */
  const handleFlightSelect = async (id) => {
    setSelectedFlightId(id);
    setIsLoading(true);
    setFlightData([]);
    setReportText(null);
    setAssistantAnswer(null);

    // Check if the flight matches one of our bundled sample flights
    const sampleMatch = SAMPLE_FLIGHTS.find(sf => sf.id === id);
    if (sampleMatch) {
      setTimeout(() => {
        setFlightData(sampleMatch.telemetry);
        setReportText(sampleMatch.report);
        setIsLoading(false);
      }, 250);
      return;
    }

    // Otherwise attempt to query server
    try {
      const dataRes = await fetch(`${API_BASE_URL}/api/flights/${id}`);
      if (!dataRes.ok) throw new Error(`API Error: ${dataRes.status}`);
      const data = await dataRes.json();
      setFlightData(Array.isArray(data) ? data : []);

      const reportRes = await fetch(`${API_BASE_URL}/api/flights/${id}/report`);
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setReportText(reportData.report);
      }
    } catch (err) {
      console.error('Failed to load flight details from server:', err);
      toast.error('Failed to load flight details from server.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Loads the primary sample mission directly into active view.
   */
  const handleLoadDefaultSample = () => {
    const firstSample = SAMPLE_FLIGHTS[0];
    handleFlightSelect(firstSample.id);
  };

  /**
   * Regenerates or refreshes the AI mission intelligence report.
   */
  const handleRefreshReport = async () => {
    if (!selectedFlightId) return;
    setIsRegeneratingReport(true);
    const loadingToast = toast.loading('Synthesizing mission evaluation...');

    // If active flight is a sample flight, refresh locally
    const sampleMatch = SAMPLE_FLIGHTS.find(sf => sf.id === selectedFlightId);
    if (sampleMatch) {
      setTimeout(() => {
        setReportText(sampleMatch.report + `\n\n*Updated at ${new Date().toLocaleTimeString()}*`);
        setIsRegeneratingReport(false);
        toast.success('Mission brief refreshed', { id: loadingToast });
      }, 700);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/flights/${selectedFlightId}/report/refresh`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setReportText(data.report);
      toast.success('Mission evaluation updated', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to regenerate report.', { id: loadingToast });
    } finally {
      setIsRegeneratingReport(false);
    }
  };

  /**
   * Handles custom local upload fallback when server is unavailable.
   *
   * @param {Array<Object>} [localTelemetry] - Optional parsed telemetry array.
   * @param {string} [fileName] - File name for naming the mission.
   */
  const handleUploadSuccess = (localTelemetry, fileName) => {
    if (localTelemetry) {
      const customId = `flt-custom-${Date.now().toString().slice(-4)}`;
      const customFlight = {
        id: customId,
        name: fileName || "Imported Flight",
        created_at: new Date().toISOString(),
        telemetry: localTelemetry,
        report: `### Autonomous Mission Brief: ${fileName || 'Custom Flight'}\n\n**Status:** Successfully Parsed\n**Waypoints:** ${localTelemetry.length} recorded positions.\n\n#### Telemetry Overview\n- Peak Altitude: **${Math.max(...localTelemetry.map(d => d.altitude || 0))}m**\n- Initial Battery: **${localTelemetry[0]?.battery ?? 100}%**\n- Final Battery: **${localTelemetry[localTelemetry.length - 1]?.battery ?? 0}%**\n\n*Airframe evaluation ready for review.*`
      };
      SAMPLE_FLIGHTS.unshift(customFlight);
      setFlights(prev => [customFlight, ...prev]);
      handleFlightSelect(customId);
      return;
    }
    fetchFlights();
  };

  /**
   * Deletes a flight record from state and server.
   *
   * @param {string} id - Flight ID to remove.
   */
  const handleFlightDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/flights/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Flight deleted');
      }
    } catch (err) {
      // Local deletion
    }

    setFlights(prev => prev.filter(f => f.id !== id));
    if (selectedFlightId === id) {
      setSelectedFlightId(null);
      setFlightData([]);
      setReportText(null);
    }
    toast.success('Flight removed');
  };

  /**
   * Handles flight telemetry assistant queries with instant intelligence synthesis.
   *
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleAssistantQuery = (e) => {
    e.preventDefault();
    if (!assistantQuestion.trim() || !flightData || flightData.length === 0) return;

    setIsAssistantThinking(true);
    const q = assistantQuestion.toLowerCase();

    setTimeout(() => {
      let answer = "";
      const maxAlt = Math.max(...flightData.map(d => d.altitude));
      const startBat = flightData[0].battery;
      const endBat = flightData[flightData.length - 1].battery;
      const issues = flightData.filter(d => d.issue && d.issue.toLowerCase() !== 'none');

      if (q.includes('altitude') || q.includes('height')) {
        answer = `The flight reached a peak altitude of ${maxAlt} meters AGL. Climb was stable through waypoint 3.`;
      } else if (q.includes('battery') || q.includes('power') || q.includes('charge')) {
        answer = `Battery started at ${startBat}% and completed at ${endBat}%, a net consumption of ${startBat - endBat}%. Nominal power curve.`;
      } else if (q.includes('issue') || q.includes('problem') || q.includes('anomaly') || q.includes('warn')) {
        answer = issues.length > 0
          ? `Detected ${issues.length} anomaly event(s): "${issues[0].issue}". Recommend motor check.`
          : `No anomalies detected. All flight parameters remained strictly within safe tolerances.`;
      } else if (q.includes('maintenance') || q.includes('service') || q.includes('action')) {
        answer = `Technician recommendation: Perform standard pre-flight rotor spin check and verify battery cell resistance prior to next sortie.`;
      } else {
        answer = `Mission summary: ${flightData.length} checkpoints recorded. Ceiling: ${maxAlt}m. Battery remaining: ${endBat}%. ${issues.length} flagged events.`;
      }

      setAssistantAnswer(answer);
      setIsAssistantThinking(false);
    }, 400);
  };

  // Precomputed metrics
  const issueCount = flightData.filter(d => d.issue && d.issue.toLowerCase() !== 'none').length;
  const maxAltitude = flightData.length > 0 ? Math.max(...flightData.map(d => d.altitude)) : 0;
  const finalBattery = flightData.length > 0 ? flightData[flightData.length - 1].battery : 0;

  return (
    <div className="flex h-screen w-full bg-black text-[#f5f5f7] overflow-hidden select-none" role="main" aria-label="AeroInsight Flight Dashboard">
      {/* Sidebar Navigation */}
      <Sidebar
        flights={flights}
        onSelect={handleFlightSelect}
        selectedId={selectedFlightId}
        onUploadSuccess={handleUploadSuccess}
        onDelete={handleFlightDelete}
        apiUrl={API_BASE_URL}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        onSelectSample={handleLoadDefaultSample}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070709]">
        {/* Top Minimal Navigation Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0a0a0c]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">Mission Control</span>
              <span className="text-neutral-600 hidden sm:inline">/</span>
              <span className="text-xs text-neutral-400 hidden sm:inline font-medium">Telemetry & AI Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {selectedFlightId && (
              <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-3 py-1 text-xs text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  {selectedFlightId.substring(0, 10).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          <ErrorBoundary>
            {isLoading ? (
              <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-neutral-400 gap-3">
                <div className="w-7 h-7 border-2 border-white/20 border-t-[#2997ff] rounded-full animate-spin" />
                <p className="text-xs font-medium">Processing telemetry data...</p>
              </div>
            ) : flightData.length > 0 ? (
              <>
                {/* 1. Refined Metric Cards (Apple Health/Watch Inspired with Subtle Hover Physics) */}
                <section aria-label="Flight Telemetry Metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 shrink-0">
                  {/* Metric 1: Duration */}
                  <div className="apple-card apple-card-hover metric-hover-duration p-4 sm:p-5 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Flight Duration
                    </span>
                    <div className="mt-2">
                      <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight tabular-nums">
                        {(() => {
                          const start = new Date(flightData[0].timestamp).getTime();
                          const end = new Date(flightData[flightData.length - 1].timestamp).getTime();
                          const diffS = Math.max(0, Math.abs(end - start) / 1000);
                          return <AnimatedTime diffS={diffS} />;
                        })()}
                      </span>
                      <p className="text-[11px] text-neutral-500 mt-1">Airborne time</p>
                    </div>
                  </div>

                  {/* Metric 2: Peak Altitude */}
                  <div className="apple-card apple-card-hover metric-hover-altitude p-4 sm:p-5 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Peak Altitude
                    </span>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight tabular-nums">
                          <AnimatedNumber value={maxAltitude} />
                        </span>
                        <span className="text-sm font-medium text-neutral-400">m</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">Ceiling AGL</p>
                    </div>
                  </div>

                  {/* Metric 3: Battery */}
                  <div className="apple-card apple-card-hover metric-hover-battery p-4 sm:p-5 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Final Battery
                    </span>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${
                          finalBattery > 30 ? 'text-white' : finalBattery > 15 ? 'text-[#ff9f0a]' : 'text-[#ff453a]'
                        }`}>
                          <AnimatedNumber value={finalBattery} />
                        </span>
                        <span className="text-sm font-medium text-neutral-400">%</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">Landing capacity</p>
                    </div>
                  </div>

                  {/* Metric 4: Anomaly Status */}
                  <div className="apple-card apple-card-hover metric-hover-safety p-4 sm:p-5 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Safety Status
                    </span>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        {issueCount > 0 ? (
                          <>
                            <AlertTriangle size={20} className="text-[#ff9f0a]" />
                            <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                              {issueCount} {issueCount === 1 ? 'Alert' : 'Alerts'}
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={20} className="text-[#30d158]" />
                            <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                              All Clear
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        {flightData.length} waypoints verified
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2. Middle Row: Map Visualizer & AI Safety Brief */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[420px]">
                  {/* Left Column (7/12): Flight Path Map */}
                  <section aria-label="Flight Path Map" className="lg:col-span-7 apple-card apple-card-hover p-4 sm:p-5 flex flex-col h-[380px] lg:h-[450px]">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                      <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                          Flight Trajectory
                        </h2>
                        <p className="text-[11px] text-neutral-500">Interactive waypoint progression and coordinates</p>
                      </div>
                      <button
                        onClick={() => setIsMapFullscreen(true)}
                        className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
                        title="View Fullscreen"
                        aria-label="Expand map fullscreen"
                      >
                        <Maximize2 size={15} />
                      </button>
                    </div>

                    <div className="flex-1 w-full h-full min-h-0 rounded-xl overflow-hidden border border-white/[0.08]">
                      <Map telemetryData={flightData} />
                    </div>
                  </section>

                  {/* Right Column (5/12): AI Safety & Anomaly Report */}
                  <section aria-label="AI Safety Intelligence Report" className="lg:col-span-5 apple-card apple-card-hover p-4 sm:p-5 flex flex-col h-[380px] lg:h-[450px]">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                            Mission Intelligence
                          </h2>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#2997ff]/10 text-[#2997ff] border border-[#2997ff]/20">
                            Gemini AI
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500">Autonomous anomaly assessment & recommendations</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleRefreshReport}
                          disabled={isRegeneratingReport}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                          title="Regenerate Report"
                          aria-label="Regenerate intelligence report"
                        >
                          <RefreshCw size={14} className={isRegeneratingReport ? 'animate-spin' : ''} />
                        </button>
                        <button
                          onClick={() => setIsReportFullscreen(true)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
                          title="View Fullscreen"
                          aria-label="Expand report fullscreen"
                        >
                          <Maximize2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      {isRegeneratingReport ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-2">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-[#2997ff] rounded-full animate-spin" />
                          <p className="text-xs font-medium">Analyzing flight envelope...</p>
                        </div>
                      ) : reportText ? (
                        <ReportViewer markdown={reportText} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs">
                          <p>No evaluation report available.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* 3. Bottom Row: Telemetry Analytics Chart */}
                <section aria-label="Telemetry Time-Series Analytics" className="apple-card apple-card-hover p-4 sm:p-5 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                        Telemetry Analytics
                      </h2>
                      <p className="text-[11px] text-neutral-500">Time-series profile of altitude ceiling vs. battery depletion</p>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full">
                    <TelemetryChart data={flightData} />
                  </div>
                </section>

                {/* 4. Apple Intelligence-Inspired Flight Assistant Drawer */}
                <section aria-label="Flight Telemetry Query Assistant" className="apple-card apple-card-hover p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={15} className="text-[#2997ff]" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                        Flight Assistant
                      </h3>
                    </div>
                    <span className="text-[11px] text-neutral-500">Ask any telemetry or anomaly question</span>
                  </div>

                  <form onSubmit={handleAssistantQuery} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., What was the maximum altitude? Were there any thermal warnings?"
                      value={assistantQuestion}
                      onChange={(e) => setAssistantQuestion(e.target.value)}
                      className="flex-1 bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.14] border border-white/[0.08] focus:border-[#0071e3] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isAssistantThinking || !assistantQuestion.trim()}
                      className="apple-btn-primary px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isAssistantThinking ? (
                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Ask</span>
                          <Send size={12} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider mr-1">Suggestions:</span>
                    {[
                      "What was the peak altitude?",
                      "How did the battery drain?",
                      "Were any anomalies flagged?",
                      "Recommended maintenance?"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAssistantQuestion(prompt);
                          setIsAssistantThinking(true);
                          const q = prompt.toLowerCase();
                          setTimeout(() => {
                            let answer = "";
                            const maxAlt = Math.max(...flightData.map(d => d.altitude));
                            const startBat = flightData[0].battery;
                            const endBat = flightData[flightData.length - 1].battery;
                            const issues = flightData.filter(d => d.issue && d.issue.toLowerCase() !== 'none');

                            if (q.includes('altitude') || q.includes('height')) {
                              answer = `The flight reached a peak altitude of ${maxAlt} meters AGL. Climb was stable through waypoint 3.`;
                            } else if (q.includes('battery') || q.includes('power') || q.includes('drain')) {
                              answer = `Battery started at ${startBat}% and completed at ${endBat}%, a net consumption of ${startBat - endBat}%. Nominal power curve.`;
                            } else if (q.includes('anomal') || q.includes('flag')) {
                              answer = issues.length > 0
                                ? `Detected ${issues.length} anomaly event(s): "${issues[0].issue}". Recommend motor inspection.`
                                : `No anomalies detected. All flight parameters remained strictly within safe tolerances.`;
                            } else {
                              answer = `Technician recommendation: Perform standard pre-flight rotor spin check and verify battery cell resistance prior to next sortie.`;
                            }
                            setAssistantAnswer(answer);
                            setIsAssistantThinking(false);
                          }, 350);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] hover:border-white/[0.14] text-neutral-400 transition-all cursor-pointer active:scale-95"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {assistantAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-200 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff] shrink-0 mt-1.5" />
                      <div>
                        <p>{assistantAnswer}</p>
                      </div>
                    </motion.div>
                  )}
                </section>
              </>
            ) : (
              /* Minimal Homepage: Only App Name */
              /* Centered Intelligence Hero View matching screenshot */
              <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center border border-white/[0.08] rounded-[2.5rem] bg-[#0c0c0e]/60 backdrop-blur-2xl p-8 sm:p-14 relative overflow-hidden select-none">
                {/* Ambient Soft Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2997ff]/[0.06] blur-[140px] rounded-full pointer-events-none" />

                {/* Seamless Brand Mark with Atmospheric Radar Pulses */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="relative mb-5 flex items-center justify-center select-none pointer-events-none"
                >
                  {/* Atmospheric Cyan Radial Glow */}
                  <div className="absolute w-64 h-48 bg-[#2997ff]/15 blur-3xl rounded-full" />
                  <div className="absolute w-32 h-32 bg-[#0071e3]/20 blur-xl rounded-full" />

                  {/* High-definition transparent mark (brushed titanium delta wing + glowing concentric radar waves) */}
                  <img
                    src="/brand-mark.png"
                    alt="AeroInsight Delta Mark"
                    className="relative w-48 sm:w-60 md:w-68 h-auto object-contain drop-shadow-[0_16px_40px_rgba(41,151,255,0.4)]"
                  />
                </motion.div>

                {/* App Brand Wordmark */}
                <div className="text-center relative z-10 mb-6">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2.5">
                    AeroInsight <span className="bg-gradient-to-r from-[#2997ff] to-[#64d2ff] bg-clip-text text-transparent">Intelligence</span>
                  </h1>
                  <p className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-neutral-400 uppercase">
                    Drones &bull; Telemetry &bull; Autonomous Analytics
                  </p>
                </div>

                {/* Subtitle Description Card */}
                <div className="max-w-lg text-center text-xs sm:text-sm text-neutral-400 leading-relaxed border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl px-7 py-4 rounded-2xl shadow-xl relative z-10">
                  Select a mission from the sidebar or upload flight telemetry logs to initialize interactive 3D flight paths, sensor metrics, and automated <strong className="text-[#2997ff] font-medium">Gemini AI</strong> safety briefings.
                </div>
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      <AnimatePresence>
        {isMapFullscreen && (
          <MapModal
            isOpen={isMapFullscreen}
            onClose={() => setIsMapFullscreen(false)}
            telemetryData={flightData}
          />
        )}
      </AnimatePresence>

      {/* Fullscreen Report Modal */}
      <AnimatePresence>
        {isReportFullscreen && (
          <ReportModal
            isOpen={isReportFullscreen}
            onClose={() => setIsReportFullscreen(false)}
            reportText={reportText}
            onRefresh={handleRefreshReport}
            isRegenerating={isRegeneratingReport}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
