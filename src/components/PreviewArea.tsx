import React, { useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
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
  // Defence in depth: the parser escapes text and allowlists URLs, but
  // this HTML still lands in dangerouslySetInnerHTML below. DOMPurify is
  // the second layer — a future parser bug must not become stored XSS.
  // data-* attributes (task index, code copy, wiki target) are kept.
  const renderedHtml = useMemo(() => {
    const raw = parseMarkdownToHtml(markdown, { globalDirection: directionMode });
    return DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] });
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

  // Render Mermaid diagrams. Mermaid is dynamically imported so its
  // ~2 MB of diagram chunks are not in the initial bundle, and it runs
  // under securityLevel 'strict': 'loose' disabled Mermaid's own
  // sanitisation and enabled `click` directives, so a diagram label could
  // carry HTML / javascript: links straight into the preview.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      // Don't pay the ~2 MB Mermaid download at all unless this document
      // actually contains a diagram.
      if (!previewRef.current?.querySelector('.mermaid')) return;
      import('mermaid')
        .then((mod) => {
          if (cancelled) return;
          const mermaid = mod.default;
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'strict',
            maxTextSize: 50000,
            fontFamily: 'Vazirmatn, Inter, sans-serif',
          });
          return mermaid.run({ querySelector: '.mermaid' });
        })
        .catch(() => {
          // Ignore invalid diagram syntax errors quietly
        });
    }, 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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
