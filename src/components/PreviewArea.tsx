import React, { useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import { parseMarkdownToHtml } from '../utils/markdownParser.ts';
import { FontType, WidthType } from './SettingsModal.tsx';

interface PreviewAreaProps {
  markdown: string;
  directionMode: 'auto' | 'rtl' | 'ltr';
  fontSize: number;
  font: FontType;
  editorWidth: WidthType;
  onToggleTask: (taskIndex: number) => void;
  onOpenWikiLink?: (targetTitle: string) => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({
  markdown,
  directionMode,
  fontSize,
  font,
  editorWidth,
  onToggleTask,
  onOpenWikiLink,
  previewRef,
}) => {
  const renderedHtml = useMemo(() => {
    return parseMarkdownToHtml(markdown, { globalDirection: directionMode });
  }, [markdown, directionMode]);

  // Width classes
  const widthClass =
    editorWidth === 'standard'
      ? 'max-w-3xl'
      : editorWidth === 'wide'
      ? 'max-w-5xl'
      : 'max-w-none';

  // Font class
  const fontClass =
    font === 'mono'
      ? 'font-mono'
      : font === 'arabic'
      ? 'font-vazirmatn'
      : font === 'serif'
      ? 'font-serif'
      : 'font-sans';

  // Render Mermaid diagrams
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Vazirmatn, Inter, sans-serif',
      });
      // Small tick to ensure elements are mounted in DOM
      const timer = setTimeout(() => {
        mermaid.run({
          querySelector: '.mermaid',
        }).catch(() => {
          // Ignore invalid diagram syntax errors quietly
        });
      }, 50);
      return () => clearTimeout(timer);
    } catch {
      // ignore
    }
  }, [renderedHtml]);

  // Attach interactive click listeners for task checkboxes, wiki links, and code copy
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Handle Wiki Link Navigation
      const wikiLink = target.closest('.wiki-link-target') as HTMLAnchorElement | null;
      if (wikiLink && onOpenWikiLink) {
        e.preventDefault();
        const docTitle = decodeURIComponent(wikiLink.getAttribute('data-wiki-target') || '');
        if (docTitle) {
          onOpenWikiLink(docTitle);
        }
        return;
      }

      // Handle Task Checkbox Toggle
      if (target.matches('.interactive-task-cb')) {
        const indexStr = target.getAttribute('data-task-index');
        if (indexStr !== null) {
          const index = parseInt(indexStr, 10);
          onToggleTask(index);
        }
      }

      // Handle Copy Code Button
      const copyBtn = target.closest('.copy-code-btn') as HTMLButtonElement | null;
      if (copyBtn) {
        const rawCode = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
        if (rawCode) {
          navigator.clipboard.writeText(rawCode).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('bg-emerald-600', 'text-white');
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.classList.remove('bg-emerald-600', 'text-white');
            }, 1800);
          });
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [renderedHtml, onToggleTask, previewRef]);

  return (
    <div
      ref={previewRef}
      className="flex-1 h-full overflow-y-auto p-6 sm:p-10 print-content select-text transition-colors"
      style={{
        fontSize: `${fontSize}px`,
      }}
    >
      <div className={`mx-auto ${widthClass} ${fontClass} transition-all`}>
        <div
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
          className="markdown-body transition-opacity duration-150"
        />
      </div>
    </div>
  );
};
