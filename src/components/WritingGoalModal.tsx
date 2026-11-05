import React, { useState, useEffect } from 'react';
import { Target, X, Check, Award, Flame } from 'lucide-react';

interface WritingGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetWords: number;
  currentWords: number;
  onSetTargetWords: (target: number) => void;
}

export const WritingGoalModal: React.FC<WritingGoalModalProps> = ({
  isOpen,
  onClose,
  targetWords,
  currentWords,
  onSetTargetWords,
}) => {
  const [customGoal, setCustomGoal] = useState(targetWords.toString());

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presets = [250, 500, 1000, 1500, 2500, 5000];
  const progressPercent = targetWords > 0 ? Math.min(100, Math.round((currentWords / targetWords) * 100)) : 0;
  const remaining = Math.max(0, targetWords - currentWords);

  const handleApply = (val: number) => {
    onSetTargetWords(val);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-neutral-100">
            <Target className="w-5 h-5 text-indigo-400" />
            <span>Writing Target & Sprint Goal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Card */}
        <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-900 border border-indigo-500/20">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Goal Progress</span>
            <span className="font-mono text-indigo-300 font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700/60 mb-3">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="text-neutral-300">
              <span className="font-bold text-white font-mono">{currentWords.toLocaleString()}</span> / {targetWords.toLocaleString()} words
            </div>
            {remaining > 0 ? (
              <span className="text-amber-400 font-medium text-[11px] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>{remaining} to go</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>Goal Reached!</span>
              </span>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-neutral-400">Target Word Presets:</div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => handleApply(preset)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  targetWords === preset
                    ? 'border-indigo-500 bg-indigo-600/30 text-indigo-200'
                    : 'border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                {preset.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="text-xs text-neutral-400 block mb-1.5">Custom Target:</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={50}
                max={50000}
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleApply(Math.max(10, parseInt(customGoal, 10) || 500))}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Set</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
