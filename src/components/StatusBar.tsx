import React from 'react';
import { Check, Globe, Sparkles, FileText } from 'lucide-react';
import { MarkdownStats } from '../utils/markdownStats.ts';
import { BidiStats } from '../utils/bidi.ts';

interface StatusBarProps {
  stats: MarkdownStats;
  bidi: BidiStats;
  cursorLine: number;
  cursorCol: number;
  activeDirection: 'rtl' | 'ltr';
  directionMode: 'auto' | 'rtl' | 'ltr';
  lastSavedAt: number;
  onOpenStats: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  bidi,
  cursorLine,
  cursorCol,
  activeDirection,
  directionMode,
  lastSavedAt,
  onOpenStats,
}) => {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 px-4 py-1.5 flex items-center justify-between text-[11px] text-neutral-400 no-print select-none z-20">
      {/* Left side: Cursor & Document metrics */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-neutral-400">
          Ln {cursorLine}, Col {cursorCol}
        </span>

        <span className="w-px h-3 bg-neutral-800"></span>

        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          title="Click to view detailed stats"
        >
          <FileText className="w-3 h-3 text-neutral-500" />
          <span>{stats.words.toLocaleString()} words</span>
          <span className="text-neutral-600">·</span>
          <span>{stats.characters.toLocaleString()} chars</span>
        </button>

        <span className="w-px h-3 bg-neutral-800 hidden sm:block"></span>

        <span className="text-neutral-500 hidden sm:inline">
          ~{stats.readingTimeMinutes} min read
        </span>
      </div>

      {/* Right side: BiDi Engine status & Save status */}
      <div className="flex items-center gap-3">
        {/* BiDi Indicator */}
        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-200 transition-colors cursor-pointer font-medium"
          title={`BiDi Auto-Direction: ${bidi.scriptSummary}`}
        >
          <Globe className="w-3 h-3 text-indigo-400" />
          <span>{directionMode === 'auto' ? 'Auto Direction' : directionMode.toUpperCase()}</span>
          <span
            className={`px-1 rounded text-[9px] font-bold uppercase tracking-wider ${
              activeDirection === 'rtl'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {activeDirection}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {bidi.rtlPercentage}% RTL
          </span>
        </button>

        <span className="w-px h-3 bg-neutral-800"></span>

        {/* Auto-save status: lastSavedAt was received but never rendered —
            the footer always said "Auto-saved" even after a failed write.
            It now shows the time of the last *successful* write. */}
        <div
          className="flex items-center gap-1 text-emerald-400/90 font-mono"
          title={`Last saved ${new Date(lastSavedAt).toLocaleTimeString()}`}
          aria-live="polite"
        >
          <Check className="w-3 h-3" />
          <span className="hidden sm:inline">
            Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <span className="w-px h-3 bg-neutral-800 hidden md:block"></span>

        {/* Premium Free Badge */}
        <div className="hidden md:flex items-center gap-1 text-[10px] text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          <span>Personal Pro</span>
        </div>
      </div>
    </footer>
  );
};
