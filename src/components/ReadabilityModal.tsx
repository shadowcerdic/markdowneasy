import React, { useEffect } from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { computeReadability } from '../utils/readability.ts';

interface ReadabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export const ReadabilityModal: React.FC<ReadabilityModalProps> = ({
  isOpen,
  onClose,
  content,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const metrics = computeReadability(content);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-sm text-neutral-100">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Readability & Style Analysis</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              iA Writer Style
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flesch Score Hero Card */}
        <div className="my-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-900 border border-indigo-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
              Reading Ease Index
            </div>
            <div className="text-3xl font-extrabold text-white mt-1">
              {metrics.fleschScore} <span className="text-xs font-normal text-neutral-400">/ 100</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{metrics.readingEase}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-neutral-400">Target Grade Level</div>
            <div className="text-lg font-bold text-indigo-300 font-mono mt-0.5">
              {metrics.gradeLevel}
            </div>
            <div className="text-[10px] text-neutral-500">Accessible to wide audience</div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 my-4 text-xs">
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="text-neutral-400 mb-1">Sentence Count</div>
            <div className="text-lg font-bold text-white font-mono">{metrics.sentenceCount}</div>
            <div className="text-[10px] text-neutral-500">Sentences in document</div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="text-neutral-400 mb-1">Avg Words / Sentence</div>
            <div className="text-lg font-bold text-white font-mono">{metrics.avgSentenceWords}</div>
            <div className="text-[10px] text-neutral-500">Ideal range: 12-18</div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="text-neutral-400 mb-1">Complex Words (3+ syl)</div>
            <div className="text-lg font-bold text-white font-mono">{metrics.complexWords}</div>
            <div className="text-[10px] text-neutral-500">{metrics.complexWordsRatio}% of total vocabulary</div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50">
            <div className="text-neutral-400 mb-1">Clarity Rating</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {metrics.fleschScore > 65 ? 'Optimal' : 'Needs Polish'}
            </div>
            <div className="text-[10px] text-neutral-500">Based on syllables & length</div>
          </div>
        </div>

        {/* Prose tips */}
        <div className="p-3 rounded-xl bg-neutral-800/40 border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            Pro tip: Shorten sentences with more than 25 words and swap three-syllable adverbs for vivid action verbs to improve reading flow.
          </span>
        </div>

        <div className="pt-4 flex justify-end">
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
