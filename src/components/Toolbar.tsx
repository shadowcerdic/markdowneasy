import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Sigma,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Columns,
  Eye,
  Edit3,
  Search,
  ListTree,
  BarChart2,
  Download,
  Printer,
  Copy,
  ChevronDown,
  ArrowLeftRight,
  Focus,
  Maximize2,
  Settings,
  AlertCircle,
  Network,
  Target,
  BookOpen,
  GitFork,
  Link2,
  Sparkles,
  Share2,
} from 'lucide-react';

interface ToolbarProps {
  onInsertMarkdown: (prefix: string, suffix?: string, defaultText?: string, isBlock?: boolean) => void;
  onToggleDirection: () => void;
  directionMode: 'auto' | 'rtl' | 'ltr';
  onChangeDirectionMode: (mode: 'auto' | 'rtl' | 'ltr') => void;
  viewMode: 'split' | 'edit' | 'preview';
  onChangeViewMode: (mode: 'split' | 'edit' | 'preview') => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isTypewriterMode: boolean;
  onToggleTypewriterMode: () => void;
  isOutlineOpen: boolean;
  onToggleOutline: () => void;
  onToggleFindReplace: () => void;
  onOpenStats: () => void;
  onOpenTableModal: () => void;
  onOpenSettings: () => void;
  onOpenExportModal: () => void;
  onQuickCopyRichText: () => void;
  onQuickCopyMarkdown: () => void;
  // Premium Features:
  onOpenGraph: () => void;
  onOpenGoalModal: () => void;
  onOpenReadability: () => void;
  currentWords: number;
  targetWords: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onInsertMarkdown,
  onToggleDirection,
  directionMode,
  onChangeDirectionMode,
  viewMode,
  onChangeViewMode,
  isFocusMode,
  onToggleFocusMode,
  isTypewriterMode,
  onToggleTypewriterMode,
  isOutlineOpen,
  onToggleOutline,
  onToggleFindReplace,
  onOpenStats,
  onOpenTableModal,
  onOpenSettings,
  onOpenExportModal,
  onQuickCopyRichText,
  onQuickCopyMarkdown,
  onOpenGraph,
  onOpenGoalModal,
  onOpenReadability,
  currentWords,
  targetWords,
}) => {
  const [isCalloutOpen, setIsCalloutOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const calloutRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const goalPercent = targetWords > 0 ? Math.min(100, Math.round((currentWords / targetWords) * 100)) : 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (calloutRef.current && !calloutRef.current.contains(e.target as Node)) {
        setIsCalloutOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Helper for formatting button clicks: preventDefault prevents losing textarea selection
  const handleFormat = (
    prefix: string,
    suffix: string = '',
    defaultText: string = '',
    isBlock: boolean = false
  ) => {
    onInsertMarkdown(prefix, suffix, defaultText, isBlock);
  };

  return (
    <div className="border-b border-white/10 bg-neutral-900/90 backdrop-blur-xl px-3 py-2 flex items-center justify-between gap-3 overflow-x-auto text-neutral-300 no-print select-none shadow-xs">
      {/* SECTION 1: Rich Text & Markdown Formatting Tools */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex items-center bg-neutral-950/60 rounded-xl p-0.5 border border-white/5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('**', '**', 'bold text');
            }}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Bold text"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('*', '*', 'italic text');
            }}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Italic text"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('~~', '~~', 'strikethrough text');
            }}
            title="Strikethrough"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('==', '==', 'highlighted text');
            }}
            title="Highlight Text"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-amber-300/80 hover:text-amber-300 transition-colors cursor-pointer"
            aria-label="Highlight text"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('`', '`', 'code');
            }}
            title="Inline Code (Ctrl+E)"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Inline code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center bg-neutral-950/60 rounded-xl p-0.5 border border-white/5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('# ', '', 'Heading 1', true);
            }}
            title="Heading 1"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('## ', '', 'Heading 2', true);
            }}
            title="Heading 2"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('### ', '', 'Heading 3', true);
            }}
            title="Heading 3"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quotes & Callouts */}
        <div className="flex items-center bg-neutral-950/60 rounded-xl p-0.5 border border-white/5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('> ', '', 'Quote text', true);
            }}
            title="Blockquote"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Callouts Dropdown */}
          <div className="relative" ref={calloutRef}>
            <button
              onClick={() => setIsCalloutOpen(!isCalloutOpen)}
              title="Insert Callout Alert"
              className="flex items-center gap-0.5 p-1.5 rounded-lg hover:bg-neutral-800 text-indigo-400 transition-colors cursor-pointer"
              aria-label="Insert Callout Alert"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
            {isCalloutOpen && (
              <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-neutral-900 border border-neutral-700/80 p-1.5 shadow-2xl z-50 text-xs animate-fadeIn">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Callout Styles
                </div>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleFormat('> [!NOTE]\n> ', '', 'Note message', true);
                    setIsCalloutOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 rounded-xl text-blue-300 flex items-center gap-2 cursor-pointer"
                >
                  <span>ℹ️</span>
                  <span>Note (ملاحظة)</span>
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleFormat('> [!TIP]\n> ', '', 'Helpful tip', true);
                    setIsCalloutOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 rounded-xl text-emerald-300 flex items-center gap-2 cursor-pointer"
                >
                  <span>💡</span>
                  <span>Tip (نصيحة)</span>
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleFormat('> [!WARNING]\n> ', '', 'Warning alert', true);
                    setIsCalloutOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 rounded-xl text-amber-300 flex items-center gap-2 cursor-pointer"
                >
                  <span>⚠️</span>
                  <span>Warning (تحذير)</span>
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleFormat('> [!IMPORTANT]\n> ', '', 'Crucial notice', true);
                    setIsCalloutOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 rounded-xl text-purple-300 flex items-center gap-2 cursor-pointer"
                >
                  <span>🚨</span>
                  <span>Important (هام)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lists & Data */}
        <div className="flex items-center bg-neutral-950/60 rounded-xl p-0.5 border border-white/5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('- ', '', 'List item', true);
            }}
            title="Bullet List"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('1. ', '', 'Numbered item', true);
            }}
            title="Numbered List"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Numbered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('- [ ] ', '', 'Task to complete', true);
            }}
            title="Interactive Task List"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            aria-label="Task list"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenTableModal}
            title="Insert Table"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Insert table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('$$\n', '\n$$', 'E = mc^2', true);
            }}
            title="Math Formula (LaTeX)"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-indigo-300 transition-colors cursor-pointer"
            aria-label="Math formula"
          >
            <Sigma className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat(
                '```mermaid\ngraph TD;\n  A[Start / شروع] --> B{Process / پردازش};\n  B -->|Valid| C[Complete / تکمیل];\n  B -->|Invalid| D[Retry / تلاش مجدد];\n```\n',
                '',
                '',
                true
              );
            }}
            title="Insert Mermaid Diagram"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            aria-label="Insert Mermaid diagram"
          >
            <GitFork className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Links, Media & Divider */}
        <div className="flex items-center bg-neutral-950/60 rounded-xl p-0.5 border border-white/5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('[[', ']]', 'Note Title');
            }}
            title="Insert Wiki-Link [[Note]] (Obsidian style)"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            aria-label="Insert Wiki Link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('[', '](https://example.com)', 'link title');
            }}
            title="Insert Web Link"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Insert link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('![', '](https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80)', 'image description');
            }}
            title="Insert Image"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Insert image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat('\n---\n', '', '', true);
            }}
            title="Horizontal Divider"
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Horizontal rule"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SECTION 2: Modern Segmented Auto BiDi & Vazirmatn Engine */}
      <div className="flex items-center gap-1.5 shrink-0 bg-neutral-950/80 rounded-2xl p-1 border border-white/10 shadow-xs">
        <div className="flex items-center text-xs font-medium bg-neutral-900 rounded-xl p-0.5 border border-white/5">
          <button
            onClick={() => {
              onChangeDirectionMode('auto');
              triggerToast('Auto BiDi Direction Activated');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              directionMode === 'auto'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Auto-detect RTL (Persian/Arabic) or LTR (English) per paragraph"
          >
            Auto BiDi
          </button>
          <button
            onClick={() => {
              onChangeDirectionMode('rtl');
              triggerToast('Forced RTL (قلم وزيرمتن / Vazirmatn)');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              directionMode === 'rtl'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Force Right-to-Left (وزیرمتن / Vazirmatn)"
          >
            RTL وزيرمتن
          </button>
          <button
            onClick={() => {
              onChangeDirectionMode('ltr');
              triggerToast('Forced LTR (English / Latin)');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              directionMode === 'ltr'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Force Left-to-Right (English/Latin)"
          >
            LTR
          </button>
        </div>

        <button
          onClick={onToggleDirection}
          title="Flip direction mode (Ctrl+Shift+X)"
          className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Flip paragraph direction"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SECTION 3: Views, Premium Suites & Universal Export Center */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Ulysses-style Writing Target Tracker Button */}
        <button
          onClick={onOpenGoalModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-white/10 hover:border-indigo-500/50 text-xs transition-all cursor-pointer hover:shadow-sm"
          title={`Writing Goal: ${currentWords} / ${targetWords} words (${goalPercent}%)`}
        >
          <Target className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-neutral-200">{goalPercent}%</span>
        </button>

        {/* View Mode Segmented Switcher */}
        <div className="flex items-center bg-neutral-950/80 rounded-xl p-0.5 border border-white/10 text-xs">
          <button
            onClick={() => onChangeViewMode('split')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'split' ? 'bg-neutral-800 text-white shadow-xs font-medium' : 'text-neutral-400 hover:text-white'
            }`}
            title="Split Editor & Live Preview"
            aria-label="Split view"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeViewMode('edit')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'edit' ? 'bg-neutral-800 text-white shadow-xs font-medium' : 'text-neutral-400 hover:text-white'
            }`}
            title="Editor Only"
            aria-label="Editor only"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeViewMode('preview')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'preview' ? 'bg-neutral-800 text-white shadow-xs font-medium' : 'text-neutral-400 hover:text-white'
            }`}
            title="Preview Reader Only"
            aria-label="Preview only"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Obsidian Knowledge Graph */}
        <button
          onClick={onOpenGraph}
          className="p-1.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-white/5 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          title="Interactive Knowledge Graph (Obsidian style)"
          aria-label="Knowledge graph"
        >
          <Network className="w-4 h-4" />
        </button>

        {/* iA Writer Readability */}
        <button
          onClick={onOpenReadability}
          className="p-1.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-white/5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          title="Readability & Style Analysis (iA Writer style)"
          aria-label="Readability analysis"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Focus Mode & Typewriter */}
        <button
          onClick={onToggleFocusMode}
          className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
            isFocusMode
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
              : 'bg-neutral-950/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/5'
          }`}
          title="Focus Mode (dims non-active text)"
          aria-label="Toggle focus mode"
        >
          <Focus className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleTypewriterMode}
          className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
            isTypewriterMode
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
              : 'bg-neutral-950/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/5'
          }`}
          title="Typewriter Scrolling (centers cursor)"
          aria-label="Toggle typewriter mode"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Document Outline */}
        <button
          onClick={onToggleOutline}
          className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
            isOutlineOpen
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
              : 'bg-neutral-950/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/5'
          }`}
          title="Table of Contents / Outline"
          aria-label="Toggle outline"
        >
          <ListTree className="w-4 h-4" />
        </button>

        {/* Find & Replace */}
        <button
          onClick={onToggleFindReplace}
          title="Find & Replace (Ctrl+F)"
          className="p-1.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Find and replace"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Document Stats */}
        <button
          onClick={onOpenStats}
          title="Document & BiDi Statistics"
          className="p-1.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Document statistics"
        >
          <BarChart2 className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Theme & Typography Settings"
          className="p-1.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* UNIVERSAL EXPORT HUB BUTTON */}
        <div className="relative" ref={exportRef}>
          <div className="flex items-center">
            {/* Primary button opens full Universal Export Center Modal */}
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Open Universal Export Center (Word, Docs, HTML, PDF, Markdown)"
              aria-label="Export options"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* Quick dropdown arrow for fast single-click copies */}
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="p-1.5 rounded-r-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs transition-colors border-l border-indigo-500/30 cursor-pointer"
              title="Quick Export Options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-neutral-900 border border-neutral-700/80 p-2 shadow-2xl z-50 text-xs text-neutral-200 animate-fadeIn">
              <div className="px-3 py-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                <span>Quick Actions</span>
                <span className="text-[9px] bg-indigo-500/20 px-1.5 py-0.2 rounded text-indigo-300">PRO</span>
              </div>

              <button
                onClick={() => {
                  onQuickCopyRichText();
                  setIsExportMenuOpen(false);
                  triggerToast('Copied Rich Text (Ready for Docs/Word)!');
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2.5 cursor-pointer text-indigo-200"
              >
                <Copy className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-semibold text-xs">Copy as Rich Text</div>
                  <div className="text-[10px] text-neutral-400">Pastes formatted into Word & Docs</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onQuickCopyMarkdown();
                  setIsExportMenuOpen(false);
                  triggerToast('Copied Raw Markdown!');
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2.5 cursor-pointer text-neutral-200"
              >
                <Copy className="w-4 h-4 text-neutral-400" />
                <div>
                  <div className="font-semibold text-xs">Copy Raw Markdown</div>
                  <div className="text-[10px] text-neutral-400">Pure markdown to clipboard</div>
                </div>
              </button>

              <div className="my-1.5 border-t border-neutral-800"></div>

              <button
                onClick={() => {
                  setIsExportMenuOpen(false);
                  onOpenExportModal();
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center justify-between cursor-pointer font-semibold text-white"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Open Export Center...</span>
                </span>
                <span className="text-[10px] text-neutral-500">PDF, HTML, MD</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern floating feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-12 right-6 z-50 bg-neutral-900 border border-indigo-500/40 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl animate-fadeIn flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
