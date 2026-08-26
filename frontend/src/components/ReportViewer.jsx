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
                    bg-transparent p-2">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
