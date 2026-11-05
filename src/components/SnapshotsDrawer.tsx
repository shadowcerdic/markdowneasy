import React, { useState } from 'react';
import { History, X, Plus, RotateCcw, Clock, Trash2, Check } from 'lucide-react';

export interface DocumentSnapshot {
  id: string;
  docId: string;
  name: string;
  content: string;
  wordsCount: number;
  timestamp: number;
}

interface SnapshotsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  docTitle: string;
  currentContent: string;
  snapshots: DocumentSnapshot[];
  onSaveSnapshot: (name: string) => void;
  onRestoreSnapshot: (content: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
}

export const SnapshotsDrawer: React.FC<SnapshotsDrawerProps> = ({
  isOpen,
  onClose,
  docId,
  docTitle,
  currentContent,
  snapshots,
  onSaveSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<DocumentSnapshot | null>(null);

  if (!isOpen) return null;

  const docSnapshots = snapshots.filter((s) => s.docId === docId);

  const handleCreate = () => {
    if (snapshotName.trim()) {
      onSaveSnapshot(snapshotName.trim());
      setSnapshotName('');
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
      />
      <div className="fixed inset-y-0 right-0 z-40 md:z-20 w-80 shrink-0 border-l border-neutral-800 bg-neutral-900/98 shadow-2xl md:shadow-none flex flex-col h-full animate-fadeIn text-neutral-100">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-neutral-200">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Version History & Snapshots</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Snapshot action */}
        <div className="p-3 border-b border-neutral-800">
          {isCreating ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Snapshot label (e.g. Draft v1)..."
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                autoFocus
                className="w-full px-3 py-1.5 rounded-xl bg-neutral-800 border border-indigo-500 text-xs text-white focus:outline-none"
              />
              <div className="flex gap-1.5 justify-end">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 text-xs font-semibold text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Create Revision Snapshot</span>
            </button>
          )}
        </div>

        {/* Snapshots List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {docSnapshots.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500 italic">
              No snapshots created yet. Create snapshots before major edits so you can roll back anytime!
            </div>
          ) : (
            docSnapshots.map((snap) => {
              const dateStr = new Date(snap.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={snap.id}
                  className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50 hover:border-neutral-600 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate">
                      {snap.name}
                    </span>
                    <button
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400"
                      title="Delete snapshot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </span>
                    <span>{snap.wordsCount} words</span>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => onRestoreSnapshot(snap.content)}
                      className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>{docSnapshots.length} revisions saved</span>
          <span className="text-emerald-400 font-mono">Local Rollback</span>
        </div>
      </div>
    </>
  );
};
