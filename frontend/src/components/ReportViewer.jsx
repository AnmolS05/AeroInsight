import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ReportViewer({ markdown }) {
  return (
    <div className="prose prose-slate prose-sm sm:prose-base max-w-none 
                    prose-headings:font-bold prose-headings:text-slate-800 
                    prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                    prose-p:text-slate-600 prose-li:text-slate-600
                    prose-strong:text-slate-700 prose-strong:font-semibold
                    bg-white rounded-lg p-2">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
