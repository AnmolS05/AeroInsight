/**
 * @file ReportViewer.jsx
 * @description Apple Documentation-inspired markdown report viewer for autonomous flight intelligence briefs.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Info, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

/**
 * ReportViewer component renders formatted AI mission summaries and telemetry evaluations.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.markdown - Raw markdown text of the evaluation report.
 * @returns {React.ReactElement} The rendered Markdown viewer.
 */
export default function ReportViewer({ markdown }) {
  const components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-lg font-semibold text-white mt-4 mb-3 border-b border-white/[0.08] pb-2 tracking-tight" {...props}>
        {props.children}
      </h1>
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-sm font-semibold text-neutral-200 mt-4 mb-2 tracking-tight" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mt-3 mb-1.5" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-xs font-medium text-neutral-300 mt-3 mb-1" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="text-xs text-neutral-400 leading-relaxed my-2" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="bg-white/[0.03] border-l-2 border-[#2997ff] p-3 rounded-r-xl my-3 flex gap-2.5 text-xs text-neutral-300" {...props}>
        <Info size={16} className="text-[#2997ff] shrink-0 mt-0.5" />
        <div className="flex-1">{props.children}</div>
      </blockquote>
    ),
    ul: ({ node, ...props }) => <ul className="space-y-1.5 my-2.5 pl-1" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal space-y-1.5 my-2.5 pl-4 text-xs text-neutral-400" {...props} />,
    li: ({ node, ...props }) => (
      <li className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed" {...props}>
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 shrink-0 mt-1.5" />
        <span>{props.children}</span>
      </li>
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-3 rounded-xl border border-white/[0.08]">
        <table className="min-w-full text-xs text-left border-collapse" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-white/[0.04] text-neutral-400 uppercase font-medium text-[10px] tracking-wider border-b border-white/[0.08]" {...props} />
    ),
    th: ({ node, ...props }) => <th className="px-3.5 py-2.5 font-medium" {...props} />,
    td: ({ node, ...props }) => (
      <td className="px-3.5 py-2.5 border-b border-white/[0.04] text-neutral-300 bg-transparent" {...props} />
    ),
    strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
    code: ({ node, inline, ...props }) => (
      <code className="bg-white/[0.06] text-neutral-200 px-1.5 py-0.5 rounded text-[11px] font-mono" {...props} />
    ),
    hr: ({ node, ...props }) => <hr className="border-t border-white/[0.06] my-4" {...props} />
  };

  return (
    <div className="text-xs text-neutral-300 select-text">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
