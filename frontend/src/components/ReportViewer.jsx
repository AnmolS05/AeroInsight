import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Info, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ReportViewer({ markdown }) {
  const components = {
    h1: ({node, ...props}) => <h1 className="text-2xl font-black text-white mt-8 mb-4 border-b border-indigo-500/20 pb-2 flex items-center gap-3" {...props}><span className="w-3 h-3 bg-indigo-500 rounded-sm rotate-45 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>{props.children}</h1>,
    h2: ({node, ...props}) => <h2 className="text-xl font-black text-indigo-200 mt-6 mb-3 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-4 before:bg-indigo-500 before:rounded-full before:mr-1" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-200 mt-4 mb-2 text-indigo-300" {...props} />,
    blockquote: ({node, ...props}) => (
      <blockquote className="bg-[#0b1120]/50 border-l-4 border-purple-500 p-4 rounded-r-xl my-4 flex gap-3 text-slate-300 italic shadow-inner" {...props}>
        <Info size={20} className="text-purple-400 shrink-0 mt-0.5" />
        <div>{props.children}</div>
      </blockquote>
    ),
    ul: ({node, ...props}) => <ul className="space-y-2 my-4" {...props} />,
    li: ({node, ...props}) => (
      <li className="flex items-start gap-2 text-slate-400 font-medium" {...props}>
        <ChevronRight size={16} className="text-indigo-500 shrink-0 mt-1" />
        <span>{props.children}</span>
      </li>
    ),
    table: ({node, ...props}) => (
      <div className="overflow-x-auto my-6 rounded-xl border border-indigo-500/20 shadow-inner">
        <table className="min-w-full text-sm text-left border-collapse" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => <thead className="bg-[#0b1120] text-indigo-300 uppercase font-black text-xs tracking-widest border-b border-indigo-500/20" {...props} />,
    th: ({node, ...props}) => <th className="px-4 py-3" {...props} />,
    td: ({node, ...props}) => <td className="px-4 py-3 border-b border-indigo-500/10 text-slate-300 bg-[#0a0f1c]/50" {...props} />,
  };

  return (
    <div className="prose prose-sm sm:prose-base max-w-none 
                    prose-p:text-slate-400 prose-p:font-medium prose-p:leading-relaxed
                    prose-strong:text-purple-400 prose-strong:font-black
                    prose-a:text-indigo-400 prose-a:font-bold hover:prose-a:text-indigo-300
                    prose-code:bg-[#0a0f1c] prose-code:text-indigo-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-[#0a0f1c] prose-pre:border prose-pre:border-indigo-500/20 prose-pre:shadow-inner prose-pre:p-4
                    bg-transparent p-2">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
