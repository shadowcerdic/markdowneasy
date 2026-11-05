import React, { useEffect, useRef, useState } from 'react';
import { FontType } from './SettingsModal.tsx';
import { detectMarkdownLineDirection } from '../utils/bidi.ts';

interface EditorAreaProps {
  content: string;
  onChange: (val: string) => void;
  directionMode: 'auto' | 'rtl' | 'ltr';
  isFocusMode: boolean;
  isTypewriterMode: boolean;
  fontSize: number;
  font: FontType;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onScrollSync?: (ratio: number) => void;
  onCursorChange?: (line: number, col: number, activeDir: 'rtl' | 'ltr') => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  content,
  onChange,
  directionMode,
  isFocusMode,
  isTypewriterMode,
  fontSize,
  font,
  textareaRef,
  onScrollSync,
  onCursorChange,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = content.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Current active line direction
  const activeLineText = lines[currentLineIndex] || '';
  const activeLineDirection =
    directionMode === 'auto'
      ? detectMarkdownLineDirection(activeLineText)
      : directionMode;

  // Determine font styling: mandate Vazirmatn for Persian and Arabic text
  const fontClass =
    activeLineDirection === 'rtl'
      ? 'font-vazirmatn'
      : font === 'mono'
      ? 'font-mono'
      : font === 'arabic'
      ? 'font-vazirmatn'
      : font === 'serif'
      ? 'font-serif'
      : 'font-sans';

  const handleCursorMovement = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, pos);
    const lineNum = textBefore.split('\n').length;
    const lastNewline = textBefore.lastIndexOf('\n');
    const colNum = pos - (lastNewline === -1 ? 0 : lastNewline + 1) + 1;

    setCurrentLineIndex(lineNum - 1);
    const lineText = lines[lineNum - 1] || '';
    const dir =
      directionMode === 'auto'
        ? detectMarkdownLineDirection(lineText)
        : directionMode;

    if (onCursorChange) {
      onCursorChange(lineNum, colNum, dir);
    }

    // Typewriter mode vertical centering
    if (isTypewriterMode && textareaRef.current) {
      const textarea = textareaRef.current;
      const lineHeightPx = fontSize * 1.6;
      const cursorY = (lineNum - 1) * lineHeightPx;
      const targetScroll = cursorY - textarea.clientHeight / 2 + lineHeightPx / 2;
      textarea.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
    
    // Sync gutter scroll
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }

    if (onScrollSync) {
      const maxScroll = scrollHeight - clientHeight;
      const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;
      onScrollSync(ratio);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Auto-pairing brackets and quotes
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key]) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);
      const closeChar = pairs[e.key];

      e.preventDefault();
      const updated =
        content.substring(0, start) +
        e.key +
        selected +
        closeChar +
        content.substring(end);
      onChange(updated);

      setTimeout(() => {
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = start + 1 + selected.length;
      }, 0);
      return;
    }

    // Tab key: indent or insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Outdent
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        if (content.substring(lineStart, lineStart + 2) === '  ') {
          const updated =
            content.substring(0, lineStart) + content.substring(lineStart + 2);
          onChange(updated);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - 2);
            textarea.selectionEnd = Math.max(lineStart, end - 2);
          }, 0);
        }
      } else {
        // Indent
        const updated =
          content.substring(0, start) + '  ' + content.substring(end);
        onChange(updated);
        setTimeout(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        }, 0);
      }
      return;
    }

    // Enter key: smart continuation for lists and quotes
    if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const currentLine = content.substring(lineStart, start);

      const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.|>|- \[[ xX]\])\s+/);
      if (listMatch) {
        // If line is empty list item, pressing enter terminates list
        if (currentLine.trim() === listMatch[0].trim()) {
          e.preventDefault();
          const updated =
            content.substring(0, lineStart) + content.substring(start);
          onChange(updated);
          setTimeout(() => {
            textarea.selectionStart = lineStart;
            textarea.selectionEnd = lineStart;
          }, 0);
          return;
        }

        e.preventDefault();
        let prefix = listMatch[0];
        // Increment ordered list
        const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);
        if (numMatch) {
          const nextNum = parseInt(numMatch[2], 10) + 1;
          prefix = `${numMatch[1]}${nextNum}. `;
        } else if (prefix.includes('[- [x]]') || prefix.includes('- [ ]')) {
          prefix = '- [ ] ';
        }

        const updated =
          content.substring(0, start) + '\n' + prefix + content.substring(start);
        onChange(updated);
        setTimeout(() => {
          textarea.selectionStart = start + 1 + prefix.length;
          textarea.selectionEnd = start + 1 + prefix.length;
        }, 0);
        return;
      }
    }
  };

  useEffect(() => {
    handleCursorMovement();
  }, [content]);

  return (
    <div className="relative flex-1 flex h-full overflow-hidden bg-transparent select-text">
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-12 sm:w-14 shrink-0 py-6 pr-3 pl-2 text-right font-mono text-xs select-none overflow-hidden text-neutral-600 border-r border-neutral-800/60 bg-neutral-950/40 no-print"
        style={{ fontSize: `${Math.max(11, fontSize - 3)}px`, lineHeight: 1.6 }}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={i}
            className={`transition-colors ${
              i === currentLineIndex
                ? 'text-indigo-400 font-bold'
                : 'hover:text-neutral-400'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 h-full overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleCursorMovement}
          onClick={handleCursorMovement}
          onScroll={handleScroll}
          dir={activeLineDirection}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Markdown editor source input"
          placeholder="Start typing your markdown here with full auto-direction support (Arabic, Hebrew, English)..."
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.6,
          }}
          className={`w-full h-full p-6 bg-transparent text-neutral-100 placeholder-neutral-600 focus:outline-none resize-none overflow-y-auto leading-relaxed ${fontClass} ${
            isFocusMode ? 'focus-mode-active' : ''
          }`}
        />
      </div>
    </div>
  );
};
