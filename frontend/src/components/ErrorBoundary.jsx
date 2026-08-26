import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#0a0f1c]/80 backdrop-blur-3xl border border-rose-500/20 rounded-[2.5rem] text-center shadow-[0_0_40px_rgba(244,63,94,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(244,63,94,0.2)] border border-rose-500/30 relative z-10">
            <AlertCircle size={32} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest drop-shadow-md relative z-10">Component Crash</h2>
          <p className="text-sm text-slate-400 font-medium max-w-md mb-8 relative z-10">
            A critical UI component failed to render. This could be due to malformed flight telemetry data or a network disruption.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] relative z-10"
          >
            Reinitialize System
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
