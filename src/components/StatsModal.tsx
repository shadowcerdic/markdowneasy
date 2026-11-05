import React, { useEffect } from 'react';
import { X, BarChart3, Clock, Type, AlignLeft, Globe } from 'lucide-react';
import { computeMarkdownStats } from '../utils/markdownStats.ts';
import { calculateBidiStats } from '../utils/bidi.ts';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, markdown }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stats = computeMarkdownStats(markdown);
  const bidi = calculateBidiStats(markdown);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-neutral-100">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Document & Script Statistics</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close statistics modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BiDi Auto-Direction Analytics Card */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-neutral-900 border border-indigo-500/20">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>BiDi Script Ratio (Auto Direction)</span>
            </span>
            <span className="font-mono">{bidi.scriptSummary}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden flex my-2 border border-neutral-700/60">
            <div 
              style={{ width: `${bidi.rtlPercentage}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500" 
              title={`Arabic/Hebrew (RTL): ${bidi.rtlPercentage}%`}
            />
            <div 
              style={{ width: `${bidi.ltrPercentage}%` }} 
              className="bg-indigo-500 h-full transition-all duration-500" 
              title={`Latin/English (LTR): ${bidi.ltrPercentage}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>RTL (Arabic/Hebrew): {bidi.rtlPercentage}% ({bidi.rtlChars} chars)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
              <span>LTR (Latin/Code): {bidi.ltrPercentage}% ({bidi.ltrChars} chars)</span>
            </span>
          </div>
        </div>

        {/* Text Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <span>Words</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{stats.words.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
              <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Characters</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{stats.characters.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">{stats.charactersNoSpaces.toLocaleString()} non-space</div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reading Time</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">~{stats.readingTimeMinutes} min</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">@ 200 words/min</div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Speaking Time</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">~{stats.speakingTimeMinutes} min</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">@ 130 words/min</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400 px-1 py-2 border-t border-neutral-800 font-mono">
          <span>{stats.paragraphs} paragraphs</span>
          <span>{stats.lines} lines</span>
          <span>{stats.headingsCount} headings</span>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
