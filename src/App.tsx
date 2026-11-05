/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_DOCUMENTS, DocumentItem } from './data/defaultDocuments.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { Toolbar } from './components/Toolbar.tsx';
import { EditorArea } from './components/EditorArea.tsx';
import { PreviewArea } from './components/PreviewArea.tsx';
import { StatusBar } from './components/StatusBar.tsx';
import { OutlineDrawer } from './components/OutlineDrawer.tsx';
import { FindReplaceBar } from './components/FindReplaceBar.tsx';
import { TableModal } from './components/TableModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { SettingsModal, ThemeType, FontType, WidthType } from './components/SettingsModal.tsx';
import { GraphModal } from './components/GraphModal.tsx';
import { WritingGoalModal } from './components/WritingGoalModal.tsx';
import { ReadabilityModal } from './components/ReadabilityModal.tsx';
import { SnapshotsDrawer, DocumentSnapshot } from './components/SnapshotsDrawer.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { calculateBidiStats } from './utils/bidi.ts';
import { computeMarkdownStats } from './utils/markdownStats.ts';
import { toggleTaskInMarkdown } from './utils/markdownParser.ts';
import { downloadFile, generateStandaloneHtml, copyRichTextToClipboard } from './utils/exporter.ts';

const STORAGE_KEYS = {
  DOCUMENTS: 'omnimark_documents_v1',
  ACTIVE_DOC_ID: 'omnimark_active_doc_id',
  THEME: 'omnimark_theme',
  FONT: 'omnimark_font',
  FONT_SIZE: 'omnimark_font_size',
  DIRECTION_MODE: 'omnimark_direction_mode',
  EDITOR_WIDTH: 'omnimark_editor_width',
  TARGET_WORDS: 'omnimark_target_words',
  SNAPSHOTS: 'omnimark_snapshots_v1',
};

/**
 * localStorage is untrusted input: a truncated write, a browser extension,
 * or a hand-edited value can leave a corrupt payload behind. The old code
 * accepted any array and crashed later (content: 42 -> content.split()).
 * Invalid entries are dropped; a wholly corrupt key is quarantined so the
 * app starts from defaults instead of white-screening.
 */
function isValidDocument(value: unknown): value is DocumentItem {
  if (typeof value !== 'object' || value === null) return false;
  const doc = value as Record<string, unknown>;
  return (
    typeof doc.id === 'string' &&
    typeof doc.title === 'string' &&
    typeof doc.content === 'string' &&
    typeof doc.updatedAt === 'number'
  );
}

function loadDocuments(): DocumentItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!saved) return DEFAULT_DOCUMENTS;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_DOCUMENTS;
    const valid = parsed.filter(isValidDocument);
    // Quarantine the corrupt key instead of re-saving over it blindly:
    // keep the valid docs, drop the broken entries.
    if (valid.length !== parsed.length) {
      try {
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(valid));
      } catch {
        // Quota/full storage: the in-memory docs are still usable.
      }
    }
    return valid.length > 0 ? valid : DEFAULT_DOCUMENTS;
  } catch {
    return DEFAULT_DOCUMENTS;
  }
}

function isValidSnapshot(value: unknown): value is DocumentSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const snap = value as Record<string, unknown>;
  return (
    typeof snap.id === 'string' &&
    typeof snap.docId === 'string' &&
    typeof snap.name === 'string' &&
    typeof snap.content === 'string' &&
    typeof snap.timestamp === 'number'
  );
}

function loadSnapshots(): DocumentSnapshot[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSnapshot);
  } catch {
    return [];
  }
}

export default function App() {
  // Load persisted documents
  const [documents, setDocuments] = useState<DocumentItem[]>(loadDocuments);

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_DOC_ID);
      if (saved && documents.some((d) => d.id === saved)) return saved;
    } catch {
      // fallback
    }
    return documents[0]?.id || DEFAULT_DOCUMENTS[0].id;
  });

  // UI state
  const [directionMode, setDirectionMode] = useState<'auto' | 'rtl' | 'ltr'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DIRECTION_MODE);
    return (saved as 'auto' | 'rtl' | 'ltr') || 'auto';
  });

  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as ThemeType) || 'slate';
  });

  const [font, setFont] = useState<FontType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT);
    return (saved as FontType) || 'sans';
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    return saved ? parseInt(saved, 10) : 15;
  });

  const [editorWidth, setEditorWidth] = useState<WidthType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EDITOR_WIDTH);
    return (saved as WidthType) || 'standard';
  });

  // Target words for Ulysses-style writing goal
  const [targetWords, setTargetWords] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TARGET_WORDS);
    return saved ? parseInt(saved, 10) : 500;
  });

  // Version revision snapshots
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>(loadSnapshots);

  // Selected tag filter (Bear style)
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Toggles
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isTypewriterMode, setIsTypewriterMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isReadabilityOpen, setIsReadabilityOpen] = useState(false);
  const [isSnapshotsOpen, setIsSnapshotsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Status & cursor state
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [activeDirection, setActiveDirection] = useState<'rtl' | 'ltr'>('ltr');
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Refs for scrolling and textarea manipulation
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  // Hoisted: the print-only PreviewArea used useRef(null) inline in JSX,
  // a Rules-of-Hooks violation that also gave it a fresh, dead ref on
  // every render (its click delegation attached to nothing).
  const printPreviewRef = useRef<HTMLDivElement | null>(null);

  // Active Document
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0] || DEFAULT_DOCUMENTS[0];

  // Debounced persistence: the old code JSON.stringify'd the whole
  // workspace and wrote localStorage synchronously on EVERY keystroke
  // (main-thread jank on large docs, QuotaExceededError at ~5 MB), and
  // only console.warn'd on failure while the UI kept showing "Auto-saved".
  // Writes now flush 500 ms after the last change, on tab hide, and on
  // page unload; lastSavedAt only advances on a successful write.
  const [saveError, setSaveError] = useState<string | null>(null);
  const persistTimerRef = useRef<number | null>(null);
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  const activeDocIdRef = useRef(activeDocId);
  activeDocIdRef.current = activeDocId;

  const flushPersist = useCallback((): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documentsRef.current));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC_ID, activeDocIdRef.current);
      setLastSavedAt(Date.now());
      setSaveError(null);
      return true;
    } catch (e) {
      console.warn('Failed to persist documents to localStorage', e);
      setSaveError(
        'Could not save — browser storage is full or unavailable. Download a backup from Export Hub.'
      );
      return false;
    }
  }, []);

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      flushPersist();
    }, 500);
  }, [flushPersist]);

  // Save documents to localStorage (debounced; see flushPersist)
  useEffect(() => {
    schedulePersist();
    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [documents, activeDocId, schedulePersist]);

  // Flush pending writes before the page is hidden or unloaded, so the
  // last 500 ms of typing is never lost when the tab closes.
  useEffect(() => {
    const flush = () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
        flushPersist();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flushPersist]);

  // Persist snapshots
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
    } catch (e) {
      console.warn('Failed to persist snapshots to localStorage', e);
    }
  }, [snapshots]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      localStorage.setItem(STORAGE_KEYS.FONT, font);
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize.toString());
      localStorage.setItem(STORAGE_KEYS.DIRECTION_MODE, directionMode);
      localStorage.setItem(STORAGE_KEYS.EDITOR_WIDTH, editorWidth);
      localStorage.setItem(STORAGE_KEYS.TARGET_WORDS, targetWords.toString());
    } catch (e) {
      // The old code had no try/catch here at all: a quota throw killed
      // the effect chain. Preferences are non-critical; warn and continue.
      console.warn('Failed to persist preferences to localStorage', e);
    }
  }, [theme, font, fontSize, directionMode, editorWidth, targetWords]);

  // Update document content
  const handleContentChange = useCallback(
    (newContent: string) => {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            // If title is default untitled, update from first heading
            let updatedTitle = doc.title;
            if (doc.title === 'Untitled Document' || doc.title === 'مستند جديد') {
              const firstHeading = newContent.match(/^#{1,3}\s+(.+)$/m);
              if (firstHeading) {
                updatedTitle = firstHeading[1].trim();
              }
            }
            return {
              ...doc,
              title: updatedTitle,
              content: newContent,
              updatedAt: Date.now(),
            };
          }
          return doc;
        })
      );
      // NOTE: lastSavedAt is intentionally NOT set here. It advances only
      // on a successful localStorage write (flushPersist); setting it per
      // keystroke made the UI claim "Auto-saved" even when saving failed.
    },
    [activeDocId]
  );

  // Document management handlers
  const handleCreateDoc = () => {
    const newId = `doc-${Date.now()}`;
    const newDoc: DocumentItem = {
      id: newId,
      title: 'Untitled Document',
      content: '# New Document\n\nStart writing your thoughts here...',
      updatedAt: Date.now(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newId);
  };

  const handleDuplicateDoc = (id: string) => {
    const target = documents.find((d) => d.id === id);
    if (!target) return;
    const newId = `doc-${Date.now()}`;
    const dupDoc: DocumentItem = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      updatedAt: Date.now(),
    };
    setDocuments((prev) => [dupDoc, ...prev]);
    setActiveDocId(newId);
  };

  const handleDeleteDoc = (id: string) => {
    if (documents.length <= 1) return;
    const target = documents.find((d) => d.id === id);
    // Deleting a document was one click with no confirm and no undo.
    if (!window.confirm(`Delete "${target?.title ?? 'this document'}"? This cannot be undone.`)) {
      return;
    }
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);
    if (activeDocId === id) {
      setActiveDocId(remaining[0].id);
    }
  };

  const handleRenameDoc = (id: string, newTitle: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, title: newTitle } : doc))
    );
  };

  const handleImportFile = (file: File) => {
    // The old code readAsText'd any dropped file of any size — the delivery
    // channel for a malicious .md, and an unbounded read into localStorage.
    const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setSaveError(`"${file.name}" is not a Markdown/text file (.md, .markdown, .txt).`);
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setSaveError(`"${file.name}" is too large to import (limit 5 MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      setSaveError(`Could not read "${file.name}".`);
    };
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      const title = file.name.replace(/\.(md|markdown|txt)$/i, '');
      const newId = `doc-${Date.now()}`;
      const newDoc: DocumentItem = {
        id: newId,
        title: title || 'Imported File',
        content,
        updatedAt: Date.now(),
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(newId);
    };
    reader.readAsText(file);
  };

  // Drag and Drop files onto window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(handleImportFile);
    }
  };

  // Insert markdown snippet into textarea with block formatting & preview-mode auto-switch
  const handleInsertMarkdown = (
    prefix: string,
    suffix: string = '',
    defaultText: string = '',
    isBlock: boolean = false
  ) => {
    // If currently in preview-only mode, switch to split view so editor is available
    if (viewMode === 'preview') {
      setViewMode('split');
    }

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = activeDoc.content.substring(start, end) || defaultText;

      let actualPrefix = prefix;
      // If block element and cursor is not at line start, prepend newline
      if (isBlock && start > 0 && activeDoc.content[start - 1] !== '\n') {
        actualPrefix = '\n' + prefix;
      }

      const newContent =
        activeDoc.content.substring(0, start) +
        actualPrefix +
        selectedText +
        suffix +
        activeDoc.content.substring(end);

      handleContentChange(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + actualPrefix.length,
          start + actualPrefix.length + selectedText.length
        );
      }, 10);
    }, viewMode === 'preview' ? 50 : 0);
  };

  // Flip paragraph direction manually (Ctrl+Shift+X)
  const handleToggleDirection = () => {
    setDirectionMode((prev) => {
      if (prev === 'auto') return 'rtl';
      if (prev === 'rtl') return 'ltr';
      return 'auto';
    });
  };

  // Synchronized scrolling
  const handleScrollSync = (ratio: number) => {
    if (viewMode === 'split' && previewRef.current) {
      const { scrollHeight, clientHeight } = previewRef.current;
      previewRef.current.scrollTop = ratio * (scrollHeight - clientHeight);
    }
  };

  // Interactive Task list toggle
  const handleToggleTask = (taskIndex: number) => {
    const updated = toggleTaskInMarkdown(activeDoc.content, taskIndex);
    handleContentChange(updated);
  };

  // Obsidian-style Wiki Link handler: jumps to or creates document
  const handleOpenWikiLink = (targetTitle: string) => {
    const existing = documents.find(
      (d) => d.title.trim().toLowerCase() === targetTitle.trim().toLowerCase()
    );
    if (existing) {
      setActiveDocId(existing.id);
    } else {
      const newId = `doc-${Date.now()}`;
      const newDoc: DocumentItem = {
        id: newId,
        title: targetTitle,
        content: `# ${targetTitle}\n\nLinked from [[${activeDoc.title}]]\n`,
        updatedAt: Date.now(),
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setActiveDocId(newId);
    }
  };

  // Revision snapshots handlers
  const handleSaveSnapshot = (name: string) => {
    const newSnapshot: DocumentSnapshot = {
      id: `snap-${Date.now()}`,
      docId: activeDocId,
      name,
      content: activeDoc.content,
      wordsCount: computeMarkdownStats(activeDoc.content).words,
      timestamp: Date.now(),
    };
    setSnapshots((prev) => [newSnapshot, ...prev]);
  };

  const handleRestoreSnapshot = (snapshotContent: string) => {
    handleContentChange(snapshotContent);
    setIsSnapshotsOpen(false);
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
  };

  // Jump to heading from Outline
  const handleSelectHeading = (_lineNumber: number, slug: string) => {
    if (viewMode === 'edit') {
      setViewMode('split');
    }
    setTimeout(() => {
      // CSS.escape: a slug starting with a digit ("123-things") makes
      // querySelector('#123-things') throw instead of scrolling.
      const targetEl = previewRef.current?.querySelector(`#${CSS.escape(slug)}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Find and replace operations
  const handleReplaceCurrent = (findText: string, replaceText: string, caseSensitive: boolean) => {
    if (!findText) return;
    try {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        caseSensitive ? '' : 'i'
      );
      // Replacer function, not a replacement string: a replaceText
      // containing $&, $' or $` used to inject the matched text.
      const updated = activeDoc.content.replace(regex, () => replaceText);
      handleContentChange(updated);
    } catch {
      // ignore regex error
    }
  };

  const handleReplaceAll = (findText: string, replaceText: string, caseSensitive: boolean) => {
    if (!findText) return;
    try {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        caseSensitive ? 'g' : 'gi'
      );
      const updated = activeDoc.content.replace(regex, () => replaceText);
      handleContentChange(updated);
    } catch {
      // ignore regex error
    }
  };

  // Export handlers
  const handleExportMarkdown = () => {
    const filename = `${activeDoc.title.replace(/[^\w\s-]/gi, '_') || 'document'}.md`;
    downloadFile(filename, activeDoc.content, 'text/markdown;charset=utf-8');
  };

  const handleExportHtml = () => {
    const filename = `${activeDoc.title.replace(/[^\w\s-]/gi, '_') || 'document'}.html`;
    const html = generateStandaloneHtml(activeDoc.title, activeDoc.content, theme);
    downloadFile(filename, html, 'text/html;charset=utf-8');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCopyHtml = () => {
    const html = generateStandaloneHtml(activeDoc.title, activeDoc.content, theme);
    navigator.clipboard.writeText(html);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(activeDoc.content);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S — actually flush the pending debounced write.
      // The old handler only stamped lastSavedAt, saving nothing.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushPersist();
      }
      // Ctrl+E: Inline Code (the toolbar tooltip advertised this shortcut,
      // but no handler existed for it)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleInsertMarkdown('`', '`', 'code');
      }
      // Ctrl+B: Bold
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        handleInsertMarkdown('**', '**', 'bold text');
      }
      // Ctrl+I: Italic
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleInsertMarkdown('*', '*', 'italic text');
      }
      // Ctrl+F: Find
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen((prev) => !prev);
      }
      // Ctrl+Shift+X: Flip direction
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleToggleDirection();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeDoc.content]);

  // Derived metrics
  const markdownStats = computeMarkdownStats(activeDoc.content);
  const bidiStats = calculateBidiStats(activeDoc.content);

  // Theme container classes
  const themeContainerClass =
    theme === 'obsidian'
      ? 'bg-black text-neutral-100'
      : theme === 'paper'
      ? 'bg-[#f8f5ee] text-[#2b2723]'
      : theme === 'minimal'
      ? 'bg-white text-neutral-900'
      : theme === 'nordic'
      ? 'bg-[#1e232a] text-[#eceff4]'
      : 'bg-slate-950 text-slate-100';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex h-screen w-screen overflow-hidden ${themeContainerClass} transition-colors duration-200 select-none relative font-sans`}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-indigo-600/20 backdrop-blur-sm border-4 border-dashed border-indigo-400 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-700 px-6 py-4 rounded-2xl shadow-2xl text-center">
            <div className="text-2xl font-bold text-white mb-1">Drop your Markdown file here</div>
            <div className="text-xs text-neutral-400">Supports .md, .markdown, and .txt files</div>
          </div>
        </div>
      )}

      {/* Sidebar: Documents Workspace & Bear Tags */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        documents={documents}
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
        onCreateDoc={handleCreateDoc}
        onDuplicateDoc={handleDuplicateDoc}
        onDeleteDoc={handleDeleteDoc}
        onRenameDoc={handleRenameDoc}
        onImportFile={handleImportFile}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        onOpenGraph={() => setIsGraphOpen(true)}
        onOpenSnapshots={() => setIsSnapshotsOpen(true)}
      />

      {/* Outline Drawer (collapsible) */}
      <OutlineDrawer
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        markdown={activeDoc.content}
        onSelectHeading={handleSelectHeading}
      />

      {/* Version Snapshots Drawer */}
      <SnapshotsDrawer
        isOpen={isSnapshotsOpen}
        onClose={() => setIsSnapshotsOpen(false)}
        docId={activeDocId}
        docTitle={activeDoc.title}
        currentContent={activeDoc.content}
        snapshots={snapshots}
        onSaveSnapshot={handleSaveSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
      />

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Toolbar with Ulysses Goal & Obsidian Graph */}
        <Toolbar
          onInsertMarkdown={handleInsertMarkdown}
          onToggleDirection={handleToggleDirection}
          directionMode={directionMode}
          onChangeDirectionMode={setDirectionMode}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          isTypewriterMode={isTypewriterMode}
          onToggleTypewriterMode={() => setIsTypewriterMode(!isTypewriterMode)}
          isOutlineOpen={isOutlineOpen}
          onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
          onToggleFindReplace={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenTableModal={() => setIsTableModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onQuickCopyRichText={() => copyRichTextToClipboard(activeDoc.title, activeDoc.content, theme)}
          onQuickCopyMarkdown={() => navigator.clipboard.writeText(activeDoc.content)}
          onOpenGraph={() => setIsGraphOpen(true)}
          onOpenGoalModal={() => setIsGoalModalOpen(true)}
          onOpenReadability={() => setIsReadabilityOpen(true)}
          currentWords={markdownStats.words}
          targetWords={targetWords}
        />

        {/* Find and Replace Bar (when opened) */}
        <FindReplaceBar
          isOpen={isFindReplaceOpen}
          onClose={() => setIsFindReplaceOpen(false)}
          content={activeDoc.content}
          onReplaceCurrent={handleReplaceCurrent}
          onReplaceAll={handleReplaceAll}
          onHighlightMatches={() => {}}
        />

        {/* Save / import failure banner. Previously a failed write only
            console.warn'd while the header kept showing a green "Auto-saved"
            dot, so data loss was invisible. */}
        {saveError && (
          <div
            role="alert"
            className="px-5 py-2 bg-rose-950/80 border-b border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 no-print"
          >
            <span>{saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              aria-label="Dismiss error"
              className="shrink-0 rounded px-2 py-0.5 hover:bg-rose-900 text-rose-100 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Modern Document Header Bar */}
        <div className="px-5 py-2.5 border-b border-white/5 bg-neutral-900/60 backdrop-blur-md flex items-center justify-between no-print select-none">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${
                saveError ? 'bg-rose-400 shadow-rose-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
              }`}
              title={saveError ? 'Save failed' : 'Auto-saved'}
            />
            <input
              type="text"
              value={activeDoc.title}
              onChange={(e) => handleRenameDoc(activeDoc.id, e.target.value)}
              className="bg-transparent text-sm sm:text-base font-bold text-neutral-100 hover:text-white focus:text-white focus:outline-none border-b border-transparent focus:border-indigo-500 transition-colors w-full max-w-lg font-vazirmatn truncate"
              aria-label="Document Title"
              placeholder="Document Title..."
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            {/* Auto Direction Script Badge */}
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-950/70 border border-white/5 text-[11px] font-mono text-neutral-300">
              <span className={`w-2 h-2 rounded-full ${bidiStats.dominantDirection === 'rtl' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
              <span>{bidiStats.dominantDirection.toUpperCase()}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400 font-sans">{bidiStats.scriptSummary}</span>
            </span>

            {/* Quick Export Button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-white/5"
            >
              <span>Export Hub</span>
            </button>
          </div>
        </div>

        {/* Split View Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
          {/* Editor Area (visible in 'split' or 'edit') */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div
              className={`flex-1 h-full overflow-hidden flex flex-col no-print ${
                viewMode === 'split' ? 'border-b md:border-b-0 md:border-r border-neutral-800/80' : ''
              }`}
            >
              <EditorArea
                content={activeDoc.content}
                onChange={handleContentChange}
                directionMode={directionMode}
                isFocusMode={isFocusMode}
                isTypewriterMode={isTypewriterMode}
                fontSize={fontSize}
                font={font}
                textareaRef={textareaRef}
                onScrollSync={handleScrollSync}
                onCursorChange={(line, col, activeDir) => {
                  setCursorLine(line);
                  setCursorCol(col);
                  setActiveDirection(activeDir);
                }}
              />
            </div>
          )}

          {/* Live Preview Area (visible in 'split' or 'preview') */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-neutral-950/20 no-print">
              <PreviewArea
                markdown={activeDoc.content}
                directionMode={directionMode}
                fontSize={fontSize}
                font={font}
                editorWidth={editorWidth}
                onToggleTask={handleToggleTask}
                onOpenWikiLink={handleOpenWikiLink}
                previewRef={previewRef}
              />
            </div>
          )}

          {/* Dedicated print preview container: always mounted in print mode even if user is in 'edit' viewMode */}
          <div className="hidden print:block print:w-full print:h-auto print-only">
            <PreviewArea
              markdown={activeDoc.content}
              directionMode={directionMode}
              fontSize={15}
              font={font}
              editorWidth="standard"
              onToggleTask={handleToggleTask}
              onOpenWikiLink={handleOpenWikiLink}
              previewRef={printPreviewRef}
            />
          </div>
        </div>

        {/* Bottom Status Bar */}
        <StatusBar
          stats={markdownStats}
          bidi={bidiStats}
          cursorLine={cursorLine}
          cursorCol={cursorCol}
          activeDirection={activeDirection}
          directionMode={directionMode}
          lastSavedAt={lastSavedAt}
          onOpenStats={() => setIsStatsOpen(true)}
        />
      </div>

      {/* Modals */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsert={(tableMd) => handleInsertMarkdown(tableMd)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        markdown={activeDoc.content}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={setTheme}
        font={font}
        onChangeFont={setFont}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        editorWidth={editorWidth}
        onChangeEditorWidth={setEditorWidth}
      />

      <GraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        documents={documents}
        currentDocId={activeDocId}
        onSelectDoc={setActiveDocId}
      />

      <WritingGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        targetWords={targetWords}
        currentWords={markdownStats.words}
        onSetTargetWords={setTargetWords}
      />

      <ReadabilityModal
        isOpen={isReadabilityOpen}
        onClose={() => setIsReadabilityOpen(false)}
        content={activeDoc.content}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={activeDoc.title}
        content={activeDoc.content}
        theme={theme}
      />
    </div>
  );
}
