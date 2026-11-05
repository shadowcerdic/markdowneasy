import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Printer,
  FileCode,
  FileText,
  Sparkles,
  Check,
  X,
  FileCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileDown,
} from 'lucide-react';
import {
  downloadFile,
  generateStandaloneHtml,
  generateCleanMarkdown,
  generatePlainText,
  copyRichTextToClipboard,
  exportToPdf,
} from '../utils/exporter.ts';
import { ThemeType } from './SettingsModal.tsx';
import { calculateBidiStats } from '../utils/bidi.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  theme: ThemeType;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  theme,
}) => {
  const [includeFrontmatter, setIncludeFrontmatter] = useState(true);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bidi = calculateBidiStats(content);
  const wordsCount = content.trim().split(/\s+/).filter(Boolean).length;
  const sanitizedTitle = (title.trim() || 'Untitled').replace(/[^\w\s\u0600-\u06FF-]/gi, '_');

  const triggerCopyFeedback = (formatName: string) => {
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // 1. Copy Rich Text for Word / Google Docs
  const handleCopyRichText = async () => {
    const success = await copyRichTextToClipboard(title, content, theme);
    if (success) {
      triggerCopyFeedback('Rich Text (Ready to paste in Docs/Word!)');
    }
  };

  // 2. Copy Markdown
  const handleCopyMarkdown = async () => {
    const md = generateCleanMarkdown(title, content, includeFrontmatter);
    await navigator.clipboard.writeText(md);
    triggerCopyFeedback('Markdown copied to clipboard!');
  };

  // 3. Download Markdown (.md)
  const handleDownloadMarkdown = () => {
    const md = generateCleanMarkdown(title, content, includeFrontmatter);
    downloadFile(`${sanitizedTitle}.md`, md, 'text/markdown;charset=utf-8');
  };

  // 4. Download Standalone HTML (.html)
  const handleDownloadHtml = () => {
    const html = generateStandaloneHtml(title, content, theme);
    downloadFile(`${sanitizedTitle}.html`, html, 'text/html;charset=utf-8');
  };

  // 5. Download Plain Text (.txt)
  const handleDownloadTxt = () => {
    const txt = generatePlainText(content);
    downloadFile(`${sanitizedTitle}.txt`, txt, 'text/plain;charset=utf-8');
  };

  // 6. Direct PDF Export (.pdf file download)
  const handleDirectPdfExport = async () => {
    setIsGeneratingPdf(true);
    try {
      const ok = await exportToPdf(title, content, theme);
      if (ok) {
        triggerCopyFeedback('PDF file downloaded successfully!');
      } else {
        triggerCopyFeedback('Print dialog triggered for PDF saving');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 7. Print / Save as PDF via Browser
  const handlePrint = () => {
    // Hide modal temporarily for clean print
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn no-print"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Universal Export Center</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Export to Word, Google Docs, PDF, Standalone HTML, or Clean Markdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success toast inside modal */}
        {copiedFormat && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copiedFormat}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Document metadata pill */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500">Document:</span>{' '}
              <span className="font-semibold text-white">{title || 'Untitled Document'}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
              <span>{wordsCount} words</span>
              <span>•</span>
              <span className="text-indigo-300">{bidi.scriptSummary}</span>
            </div>
          </div>

          {/* Quick Copy Section (Most requested by real writers) */}
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Clipboard (One-Click Copy)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Rich Text Copy */}
              <button
                onClick={handleCopyRichText}
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-900 border border-indigo-500/30 hover:border-indigo-500 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Copy as Rich Text
                    </span>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Pastes directly with beautiful formatting, tables, and Vazirmatn font into{' '}
                    <strong className="text-neutral-300">Google Docs, Microsoft Word, Gmail, Telegram</strong>.
                  </p>
                </div>
                <div className="mt-3 flex items-center text-xs font-semibold text-indigo-400 gap-1 group-hover:translate-x-0.5 transition-transform">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Formatted</span>
                </div>
              </button>

              {/* Raw Markdown Copy */}
              <button
                onClick={handleCopyMarkdown}
                className="p-4 rounded-2xl bg-neutral-950/50 hover:bg-neutral-800/50 border border-neutral-800 hover:border-neutral-700 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-neutral-400" />
                      Copy Raw Markdown
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Copies pure markdown source code to clipboard with optional YAML frontmatter.
                  </p>
                </div>
                <div className="mt-3 flex items-center text-xs font-semibold text-neutral-300 gap-1">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </div>
              </button>
            </div>
          </div>

          {/* Download Files Section */}
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>File Downloads</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Standalone HTML */}
              <button
                onClick={handleDownloadHtml}
                className="p-3.5 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                  <FileCode className="w-4 h-4" />
                </div>
                <div className="font-semibold text-xs text-white">Standalone HTML</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Self-contained file with embedded Vazirmatn fonts
                </div>
              </button>

              {/* Markdown File */}
              <button
                onClick={handleDownloadMarkdown}
                className="p-3.5 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="font-semibold text-xs text-white">Markdown (.md)</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Standard format for Obsidian, GitHub & Notion
                </div>
              </button>

              {/* Plain Text File */}
              <button
                onClick={handleDownloadTxt}
                className="p-3.5 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="font-semibold text-xs text-white">Plain Text (.txt)</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Clean text stripped of markdown markup
                </div>
              </button>
            </div>
          </div>

          {/* Print & PDF Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-950/90 via-neutral-900 to-neutral-950/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Export as PDF Document</span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Vazirmatn Embedded
                  </span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Direct client-side .pdf generation or browser print dialog with print styling
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {/* Direct PDF File Generator */}
              <button
                onClick={handleDirectPdfExport}
                disabled={isGeneratingPdf}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-amber-600/20 cursor-pointer"
                title="Download formatted .pdf file directly"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download .pdf</span>
                  </>
                )}
              </button>

              {/* Browser Print Fallback */}
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700/60"
                title="Open browser print / Save as PDF dialog"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Options: Frontmatter toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeFrontmatter}
                onChange={(e) => setIncludeFrontmatter(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 focus:outline-none accent-indigo-500 cursor-pointer"
              />
              <span>Include YAML metadata header (title, date, tags, direction) in markdown</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <div>OmniMark BiDi Export Engine · All formats 100% Client-Side</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
