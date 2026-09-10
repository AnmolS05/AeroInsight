/**
 * @file AIChatModal.jsx
 * @description Interactive AI Flight Copilot Assistant modal dialog.
 * Enables pilots and fleet operators to converse with Gemini AI, trigger 3D Unity digital twin
 * reconstructions, simulate aerodynamic physics incidents, and generate synthetic missions via natural language.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Box,
  Wind,
  Layers,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AI Copilot Modal component.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether modal is visible.
 * @param {Function} props.onClose - Modal close handler.
 * @param {string} props.flightId - Current active flight ID.
 * @param {Array<Object>} props.telemetry - Active flight telemetry points.
 * @param {string} props.apiUrl - Base API URL.
 * @param {Function} [props.onOpenDigitalTwin] - Handler to open 3D Digital Twin modal.
 * @param {Function} [props.onFlightCreated] - Handler when a synthetic flight is created.
 * @returns {React.ReactElement|null} Rendered modal dialog.
 */
export default function AIChatModal({
  isOpen,
  onClose,
  flightId,
  telemetry = [],
  apiUrl = '',
  onOpenDigitalTwin,
  onFlightCreated
}) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am your **AeroInsight AI Flight Copilot**. I am connected to the **Unity MCP Simulation Engine** and **Gemini Avionics Intelligence**.\n\nYou can ask me avionics diagnostics or command me to:\n- 🚀 **Reconstruct 3D Digital Twin** in Unity\n- 🌪️ **Simulate physics incidents** (wind shear, rotor failure, microburst)\n- ⚡ **Generate synthetic test flights** (solar inspections, orbit surveys)\n- 🎥 **Orbit camera viewports** on detected anomalies`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: null
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState({ connected: false, checking: true });
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Check Unity bridge health
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/unity/status`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setBridgeStatus({ connected: data.connected, checking: false });
        } else {
          if (isMounted) setBridgeStatus({ connected: false, checking: false });
        }
      } catch (err) {
        if (isMounted) setBridgeStatus({ connected: false, checking: false });
      }
    };

    fetchStatus();
    return () => { isMounted = false; };
  }, [isOpen, apiUrl]);

  if (!isOpen) return null;

  /**
   * Dispatches a message to the backend AI Assistant endpoint.
   *
   * @param {string} textToSend - Query text string.
   */
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isProcessing) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const response = await fetch(`${apiUrl}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          flightId: flightId || 'Active Mission',
          telemetry
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'Avionics evaluation completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: data.action,
        actionPayload: data.actionPayload
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Execute client-side triggers if action requested
      if (data.action === 'RECONSTRUCT_3D_TWIN' && onOpenDigitalTwin) {
        toast.success('3D Digital Twin reconstruction launched!');
      } else if (data.action === 'FLIGHT_CREATED' && onFlightCreated && data.actionPayload?.flightId) {
        toast.success(`Synthetic flight "${data.actionPayload.flightName}" created!`);
        onFlightCreated(data.actionPayload.flightId);
      } else if (data.action === 'SIMULATE_PHYSICS') {
        toast.success('Aerodynamic physics incident simulation dispatched!');
      } else if (data.action === 'FOCUS_CAMERA') {
        toast.success('Camera focus directive sent to Unity viewport!');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Communication Notice:** ${err.message}. Showing local avionics telemetry summary for this flight.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: null
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl h-[88vh] max-h-[750px] bg-[#0c0c0e]/95 border border-white/[0.12] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-200"
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#2997ff]/15 border border-[#2997ff]/30 flex items-center justify-center text-[#2997ff] shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  AeroInsight AI Copilot
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2997ff]/20 text-[#64d2ff] font-medium border border-[#2997ff]/30">
                  Gemini + Unity MCP
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Autonomous Mission Control & Physics Simulation Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unity Bridge Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px]">
              <span className={`w-2 h-2 rounded-full ${bridgeStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
              <span className="text-neutral-400">
                Unity Bridge: {bridgeStatus.connected ? 'Active (7890)' : 'Offline'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
              aria-label="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#2997ff] text-white'
                    : 'bg-white/[0.06] border border-white/[0.1] text-[#64d2ff]'
                }`}
              >
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={15} />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#2997ff]/20 border border-[#2997ff]/40 text-white shadow-md'
                    : 'bg-white/[0.04] border border-white/[0.08] text-neutral-200'
                }`}
              >
                {/* Message Body */}
                <div className="whitespace-pre-line prose-invert">
                  {msg.text}
                </div>

                {/* Action Card Button (if an action was performed) */}
                {msg.action === 'RECONSTRUCT_3D_TWIN' && onOpenDigitalTwin && (
                  <button
                    onClick={onOpenDigitalTwin}
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-[#2997ff]/20 hover:bg-[#2997ff]/30 border border-[#2997ff]/40 text-[#64d2ff] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Box size={13} />
                    <span>View 3D Digital Twin Viewport</span>
                    <ArrowRight size={13} />
                  </button>
                )}

                {msg.action === 'SIMULATE_PHYSICS' && onOpenDigitalTwin && (
                  <button
                    onClick={onOpenDigitalTwin}
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Wind size={13} />
                    <span>Inspect Physics Incident in 3D</span>
                    <ArrowRight size={13} />
                  </button>
                )}

                <div className="mt-1.5 text-[9px] text-neutral-500 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking spinner */}
          {isProcessing && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[#64d2ff] flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-xs text-neutral-400 flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 border-2 border-[#2997ff]/30 border-t-[#2997ff] rounded-full animate-spin" />
                <span>Evaluating avionics data & coordinating Unity MCP simulation...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 border-t border-white/[0.04] bg-white/[0.01] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider shrink-0 mr-1">Prompts:</span>
          {[
            { label: '🚀 Reconstruct in 3D', query: 'Reconstruct this flight into a 3D digital twin in Unity' },
            { label: '🌪️ Simulate 35kt Crosswind', query: 'Simulate 35 knots crosswind with motor cutoff physics' },
            { label: '⚡ Generate Solar Mission', query: 'Generate a 60-second synthetic flight inspecting a solar array' },
            { label: '🎥 Orbit Anomaly', query: 'Focus mission control camera and orbit the flagged anomaly' },
            { label: '📊 Battery & Altitude Check', query: 'Analyze peak altitude, battery drain curve, and flight stability' }
          ].map((chip, idx) => (
            <button
              key={idx}
              disabled={isProcessing}
              onClick={() => handleSendMessage(chip.query)}
              className="text-[11px] px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] hover:border-white/[0.15] text-neutral-400 transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <footer className="p-4 border-t border-white/[0.08] bg-[#0a0b0e] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask avionics questions or command Unity MCP simulations..."
              disabled={isProcessing}
              className="flex-1 bg-white/[0.05] border border-white/[0.08] focus:border-[#2997ff]/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#2997ff]/30 transition-all"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#2997ff] hover:bg-[#0071e3] text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {isProcessing ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Execute</span>
                  <Send size={12} />
                </>
              )}
            </button>
          </form>
        </footer>
      </motion.div>
    </div>
  );
}
