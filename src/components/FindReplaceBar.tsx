import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, Replace, ReplaceAll } from 'lucide-react';

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onReplaceCurrent: (findText: string, replaceText: string, caseSensitive: boolean, matchIndex: number) => void;
  onReplaceAll: (findText: string, replaceText: string, caseSensitive: boolean) => void;
  onNavigateMatch: (start: number, end: number) => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  onClose,
  content,
  onReplaceCurrent,
  onReplaceAll,
  onNavigateMatch,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  // Match positions, not just a count: Next/Prev select the actual match in
  // the editor and Replace targets that match — previously the counter was
  // cosmetic and Replace always hit the first occurrence in the document.
  const matches: { start: number; end: number }[] = [];
  if (findText.trim()) {
    try {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        caseSensitive ? 'g' : 'gi'
      );
      let m: RegExpExecArray | null;
      while ((m = regex.exec(content)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length });
      }
    } catch {
      // invalid pattern: no matches
    }
  }
  const matchCount = matches.length;
  // After a replace shrinks the match list, clamp instead of pointing past the end.
  const effectiveIndex = matchCount === 0 ? 0 : Math.min(Math.max(currentIndex, 1), matchCount);

  const handleFindChange = (val: string) => {
    setFindText(val);
    setCurrentIndex(val ? 1 : 0);
  };

  const goToMatch = (index1: number) => {
    setCurrentIndex(index1);
    const m = matches[index1 - 1];
    if (m) onNavigateMatch(m.start, m.end);
  };

  const handleNext = () => {
    if (matchCount === 0) return;
    goToMatch(effectiveIndex >= matchCount ? 1 : effectiveIndex + 1);
  };

  const handlePrev = () => {
    if (matchCount === 0) return;
    goToMatch(effectiveIndex <= 1 ? matchCount : effectiveIndex - 1);
  };

  return (
    <div className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs text-neutral-200 shadow-md">
      {/* Search Input */}
      <div className="flex items-center gap-1.5 bg-neutral-800/80 rounded-lg px-2.5 py-1.5 border border-neutral-700/60 focus-within:border-indigo-500 min-w-[220px]">
        <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <input
          type="text"
          placeholder="Find in document..."
          value={findText}
          onChange={(e) => handleFindChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) handlePrev();
              else handleNext();
            }
          }}
          className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full"
          autoFocus
        />
        {findText && (
          <span className="text-[10px] text-neutral-400 font-mono shrink-0 pl-1">
            {matchCount > 0 ? `${effectiveIndex}/${matchCount}` : 'No matches'}
          </span>
        )}
      </div>

      {/* Prev / Next buttons */}
      <div className="flex items-center gap-1 bg-neutral-800/60 rounded-lg p-0.5 border border-neutral-700/50">
        <button
          onClick={handlePrev}
          disabled={matchCount === 0}
          className="p-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleNext}
          disabled={matchCount === 0}
          className="p-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace Input */}
      <div className="flex items-center gap-1.5 bg-neutral-800/80 rounded-lg px-2.5 py-1.5 border border-neutral-700/60 focus-within:border-indigo-500 min-w-[200px]">
        <input
          type="text"
          placeholder="Replace with..."
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onReplaceCurrent(findText, replaceText, caseSensitive, effectiveIndex - 1)}
          disabled={matchCount === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 disabled:opacity-40 transition-colors"
        >
          <Replace className="w-3 h-3" />
          <span>Replace</span>
        </button>
        <button
          onClick={() => onReplaceAll(findText, replaceText, caseSensitive)}
          disabled={matchCount === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white disabled:opacity-40 transition-colors font-medium"
        >
          <ReplaceAll className="w-3 h-3" />
          <span>All</span>
        </button>
      </div>

      {/* Case sensitivity toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-400 hover:text-neutral-200 select-none ml-auto">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => {
            setCaseSensitive(e.target.checked);
            setCurrentIndex(1);
          }}
          className="rounded bg-neutral-800 border-neutral-700 text-indigo-500"
        />
        <span>Match Case (Aa)</span>
      </label>

      {/* Close button */}
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        aria-label="Close find and replace"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
