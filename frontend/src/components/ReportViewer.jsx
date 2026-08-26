import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ReportViewer({ markdown }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none 
                    prose-headings:font-black prose-headings:text-white prose-headings:tracking-tight
                    prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                    prose-p:text-slate-400 prose-p:font-medium prose-p:leading-relaxed prose-li:text-slate-400
                    prose-strong:text-purple-400 prose-strong:font-black
                    prose-a:text-indigo-400 prose-a:font-bold hover:prose-a:text-indigo-300
                    prose-code:bg-[#0a0f1c] prose-code:text-indigo-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-[#0a0f1c] prose-pre:border prose-pre:border-indigo-500/20 prose-pre:shadow-inner prose-pre:p-4
                    bg-transparent p-2">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
