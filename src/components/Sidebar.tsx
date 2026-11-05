import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Upload,
  Check,
  X,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Network,
  History,
  Tag as TagIcon,
} from 'lucide-react';
import { DocumentItem } from '../data/defaultDocuments.ts';
import { detectDirection } from '../utils/bidi.ts';
import { getAllTagsWithCounts, extractTags } from '../utils/tags.ts';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  documents: DocumentItem[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onDuplicateDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onRenameDoc: (id: string, newTitle: string) => void;
  onImportFile: (file: File) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onOpenGraph: () => void;
  onOpenSnapshots: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  documents,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onDuplicateDoc,
  onDeleteDoc,
  onRenameDoc,
  onImportFile,
  selectedTag,
  onSelectTag,
  onOpenGraph,
  onOpenSnapshots,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const startRename = (doc: DocumentItem) => {
    setEditingId(doc.id);
    setRenameTitle(doc.title);
  };

  const saveRename = (id: string) => {
    if (renameTitle.trim()) {
      onRenameDoc(id, renameTitle.trim());
    }
    setEditingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportFile(e.target.files[0]);
    }
  };

  const allTags = getAllTagsWithCounts(documents);

  const [searchDocQuery, setSearchDocQuery] = useState('');

  // Filter documents by tag and search query
  const filteredDocs = documents.filter((doc) => {
    const matchesTag = !selectedTag || extractTags(doc.content).includes(selectedTag);
    const matchesQuery =
      !searchDocQuery ||
      doc.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchDocQuery.toLowerCase());
    return matchesTag && matchesQuery;
  });

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-14 left-2 z-30 p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-400 hover:text-white shadow-lg transition-transform hover:scale-105 no-print"
        title="Open Documents Workspace"
        aria-label="Open documents workspace"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        onClick={onToggle}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
      />
      <div className="fixed inset-y-0 left-0 z-40 md:static md:z-30 w-72 shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full text-neutral-200 select-none shadow-2xl md:shadow-none transition-all no-print">
        {/* Top Header / Branding */}
        <div className="p-3.5 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              OM
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-white">
                <span>OmniMark</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO FREE
                </span>
              </div>
              <div className="text-[10px] text-neutral-400">Vazirmatn & BiDi Engine</div>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Collapse Sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Document & Import Actions */}
        <div className="p-3 space-y-2 border-b border-neutral-800/80">
          <button
            onClick={onCreateDoc}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>

          <label className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Open .md / .txt file</span>
            <input
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Quick Pro Utilities: Graph & Snapshots */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onOpenGraph}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors"
              title="Obsidian-style Knowledge Graph"
            >
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              <span>Graph View</span>
            </button>
            <button
              onClick={onOpenSnapshots}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors"
              title="Version Revision Snapshots"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Snapshots</span>
            </button>
          </div>
        </div>

        {/* Bear-style Tags Sidebar Filter */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 border-b border-neutral-800/80">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
              <span className="flex items-center gap-1">
                <TagIcon className="w-3 h-3 text-indigo-400" />
                <span>Tags</span>
              </span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-indigo-400 hover:underline cursor-pointer lowercase font-normal"
                >
                  clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto py-0.5">
              {allTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors border ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                  }`}
                >
                  #{tag} <span className="opacity-60 text-[9px]">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Notes Input */}
        <div className="px-3 pt-2">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchDocQuery}
            onChange={(e) => setSearchDocQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>
              {selectedTag ? `Files tagged #${selectedTag}` : `Files (${filteredDocs.length})`}
            </span>
            <Layers className="w-3 h-3 text-neutral-600" />
          </div>

          {filteredDocs.map((doc) => {
            const isActive = doc.id === activeDocId;
            const isRtl = detectDirection(doc.title) === 'rtl';
            const wordCount = doc.content.trim().split(/\s+/).filter(Boolean).length;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`group relative rounded-xl p-2.5 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-neutral-900 border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/20'
                    : 'border-transparent hover:bg-neutral-900/60 hover:border-neutral-800'
                }`}
              >
                {/* Active left indicator glow */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r" />
                )}

                {editingId === doc.id ? (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(doc.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-full bg-neutral-800 border border-indigo-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => saveRename(doc.id)}
                      className="p-1 rounded text-emerald-400 hover:bg-neutral-800"
                      aria-label="Save title"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded text-neutral-400 hover:bg-neutral-800"
                      aria-label="Cancel rename"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 pl-1">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-neutral-500'
                        }`}
                      />
                      <div className="truncate flex-1">
                        <div
                          className={`text-xs font-medium truncate ${
                            isActive ? 'text-white font-semibold' : 'text-neutral-300'
                          } ${isRtl ? 'font-vazirmatn' : ''}`}
                          dir={isRtl ? 'rtl' : 'ltr'}
                        >
                          {doc.title || 'Untitled Document'}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {wordCount} words
                        </div>
                      </div>
                    </div>

                    {/* Actions on hover */}
                    <div
                      className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startRename(doc)}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        title="Rename"
                        aria-label="Rename document"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDuplicateDoc(doc.id)}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        title="Duplicate"
                        aria-label="Duplicate document"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {documents.length > 1 && (
                        <button
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400"
                          title="Delete"
                          aria-label="Delete document"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auto Direction</span>
          </span>
          <span className="text-neutral-400 font-mono text-[10px]">Vazirmatn Active</span>
        </div>
      </div>
    </>
  );
};
