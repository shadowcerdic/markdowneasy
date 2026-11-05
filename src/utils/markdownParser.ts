/**
 * High-performance BiDi-Aware Markdown Engine
 * Automatically assigns text direction (RTL / LTR) to every heading, paragraph, list item, and blockquote,
 * while keeping code, tables, and math formatted properly.
 */

import { detectMarkdownLineDirection, detectDirection } from './bidi.ts';

export interface ParseOptions {
  globalDirection?: 'auto' | 'rtl' | 'ltr';
  enableTasks?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parses inline markdown: bold, italic, strikethrough, highlight, code, math, links, images, sub/sup.
 */
export function parseInlineMarkdown(text: string): string {
  let result = escapeHtml(text);

  // Math inline: $expression$
  result = result.replace(/\$([^\$\n]+)\$/g, (_match, expr) => {
    return `<span class="inline-math px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 font-mono text-xs select-all" dir="ltr">LaTeX: ${expr}</span>`;
  });

  // Images: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
    return `<img src="${url}" alt="${alt}" class="rounded-xl border border-neutral-700/50 my-3 max-w-full shadow-md object-cover hover:opacity-95 transition-opacity" loading="lazy" />`;
  });

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 font-medium transition-colors">${label}</a>`;
  });

  // Inline Code: `code` (always forced LTR)
  result = result.replace(/`([^`]+)`/g, (_match, code) => {
    return `<code class="px-1.5 py-0.5 rounded-md bg-neutral-800 border border-neutral-700/60 font-mono text-xs text-amber-300 font-medium inline-block" dir="ltr">${code}</code>`;
  });

  // Highlight: ==text==
  result = result.replace(/==([^=]+)==/g, '<mark class="bg-amber-400/25 text-amber-200 px-1 py-0.5 rounded border-b border-amber-400/50">$1</mark>');

  // Bold & Italic: ***text*** or ___text___
  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  result = result.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');

  // Bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-100">$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<strong class="font-semibold text-neutral-100">$1</strong>');

  // Italic: *text* or _text_
  result = result.replace(/\*([^*]+)\*/g, '<em class="italic text-neutral-200">$1</em>');
  result = result.replace(/_([^_]+)_/g, '<em class="italic text-neutral-200">$1</em>');

  // Strikethrough: ~~text~~
  result = result.replace(/~~([^~]+)~~/g, '<del class="line-through text-neutral-400">$1</del>');

  // Superscript: ^text^
  result = result.replace(/\^([^^]+)\^/g, '<sup class="text-[0.75em] text-neutral-300">$1</sup>');

  // Wiki Links: [[Target]] or [[Target|Label]]
  result = result.replace(/\[\[([^\]]+)\]\]/g, (_match, inner) => {
    const parts = inner.split('|');
    const target = parts[0].trim();
    const label = (parts[1] || parts[0]).trim();
    return `<a href="#wiki:${encodeURIComponent(target)}" class="wiki-link-target inline-flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 font-medium px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/20 hover:border-indigo-400 transition-colors cursor-pointer" data-wiki-target="${encodeURIComponent(target)}"><span class="text-xs opacity-60">⟦</span>${label}<span class="text-xs opacity-60">⟧</span></a>`;
  });

  // Hashtags: #tag (excluding hex colors or headings)
  result = result.replace(/(^|\s)#([a-zA-Z\u0600-\u06FF\u0590-\u05FF0-9_\/-]+)(?=\s|$|[.,!?;:])/g, (_match, prefix, tag) => {
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$|^\d+$/.test(tag)) {
      return `${prefix}#${tag}`;
    }
    return `${prefix}<span class="inline-tag px-1.5 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 text-indigo-300 font-mono text-xs hover:border-indigo-500/50 transition-colors cursor-pointer" data-tag="${tag}">#${tag}</span>`;
  });

  return result;
}

/**
 * Resolves block direction given the line content and global setting.
 */
function resolveBlockDirection(rawText: string, globalDirection: 'auto' | 'rtl' | 'ltr'): 'rtl' | 'ltr' {
  if (globalDirection === 'rtl' || globalDirection === 'ltr') {
    return globalDirection;
  }
  return detectMarkdownLineDirection(rawText);
}

/**
 * Converts Markdown source code into responsive, accessible, BiDi-aware HTML.
 */
export function parseMarkdownToHtml(markdown: string, options: ParseOptions = {}): string {
  if (!markdown || !markdown.trim()) {
    return '<div class="py-12 text-center text-neutral-500 italic">No content yet. Start typing to see live preview...</div>';
  }

  const globalDir = options.globalDirection || 'auto';
  const lines = markdown.split(/\r\n|\r|\n/);
  const htmlBlocks: string[] = [];
  
  let i = 0;
  let taskIndex = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced Code Blocks (``` or ~~~)
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const fenceMatch = trimmed.match(/^(`{3,}|~{3,})(.*)$/);
      const fenceMarker = fenceMatch ? fenceMatch[1] : '```';
      const lang = fenceMatch && fenceMatch[2] ? fenceMatch[2].trim() : 'text';
      
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith(fenceMarker)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence

      const codeRaw = codeLines.join('\n');
      const codeContent = escapeHtml(codeRaw);

      if (lang === 'mermaid') {
        htmlBlocks.push(`
          <div class="my-6 rounded-2xl overflow-hidden border border-indigo-500/30 bg-neutral-900/80 p-4 shadow-xl text-center" dir="ltr">
            <div class="flex items-center justify-between pb-3 mb-2 border-b border-neutral-800 text-xs text-neutral-400 font-mono">
              <span class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
                <span class="font-semibold text-indigo-300">Mermaid Diagram</span>
              </span>
              <button class="copy-code-btn px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11px]" data-code="${encodeURIComponent(codeRaw)}">
                Copy Diagram Code
              </button>
            </div>
            <div class="mermaid-diagram-block flex justify-center overflow-x-auto py-3 text-neutral-100" data-code="${encodeURIComponent(codeRaw)}">
              <div class="mermaid text-xs font-mono text-neutral-300">${codeContent}</div>
            </div>
          </div>
        `);
        continue;
      }

      htmlBlocks.push(`
        <div class="my-5 rounded-xl overflow-hidden border border-neutral-700/60 bg-neutral-900/90 shadow-lg group relative" dir="ltr">
          <div class="flex items-center justify-between px-4 py-2 bg-neutral-800/80 border-b border-neutral-700/50 text-xs text-neutral-400 font-mono">
            <span class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500/70 inline-block"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block"></span>
              <span class="font-semibold text-neutral-300 ml-1 uppercase tracking-wider">${lang || 'code'}</span>
            </span>
            <button class="copy-code-btn px-2 py-1 rounded bg-neutral-700/60 hover:bg-neutral-600 text-neutral-300 hover:text-white transition-colors cursor-pointer" data-code="${encodeURIComponent(codeRaw)}">
              Copy
            </button>
          </div>
          <pre class="p-4 text-xs sm:text-sm font-mono text-neutral-200 overflow-x-auto leading-relaxed"><code class="language-${lang}">${codeContent}</code></pre>
        </div>
      `);
      continue;
    }

    // Math block ($$ ... $$)
    if (trimmed.startsWith('$$')) {
      i++;
      const mathLines: string[] = [];
      if (trimmed.length > 2 && trimmed.endsWith('$$') && trimmed !== '$$') {
        mathLines.push(trimmed.slice(2, -2).trim());
      } else {
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().endsWith('$$')) {
          const lastLine = lines[i].trim().replace(/\$\$$/, '');
          if (lastLine) mathLines.push(lastLine);
          i++;
        }
      }
      const mathExpr = escapeHtml(mathLines.join('\n'));
      htmlBlocks.push(`
        <div class="my-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 font-mono text-center overflow-x-auto" dir="ltr">
          <div class="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-1">Display Equation</div>
          <div class="text-sm sm:text-base py-1 font-mono">${mathExpr}</div>
        </div>
      `);
      continue;
    }

    // Callout / Alerts (> [!NOTE], > [!TIP], etc.)
    if (trimmed.startsWith('> [!')) {
      const calloutMatch = trimmed.match(/^>\s*\[!([A-Z]+)\]/i);
      const calloutType = calloutMatch ? calloutMatch[1].toUpperCase() : 'NOTE';
      
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        calloutLines.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }

      const bodyText = calloutLines.join('\n').trim();
      const dir = resolveBlockDirection(bodyText || calloutType, globalDir);

      let themeClass = 'border-blue-500/40 bg-blue-950/20 text-blue-200';
      let titleColor = 'text-blue-400';
      let icon = 'ℹ️';

      if (calloutType === 'TIP') {
        themeClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200';
        titleColor = 'text-emerald-400';
        icon = '💡';
      } else if (calloutType === 'WARNING') {
        themeClass = 'border-amber-500/40 bg-amber-950/20 text-amber-200';
        titleColor = 'text-amber-400';
        icon = '⚠️';
      } else if (calloutType === 'IMPORTANT' || calloutType === 'CAUTION') {
        themeClass = 'border-rose-500/40 bg-rose-950/20 text-rose-200';
        titleColor = 'text-rose-400';
        icon = '🚨';
      }

      htmlBlocks.push(`
        <div class="my-4 rounded-xl border p-4 shadow-sm ${themeClass}" dir="${dir}">
          <div class="flex items-center gap-2 font-semibold ${titleColor} text-sm mb-1.5">
            <span>${icon}</span>
            <span class="tracking-wide uppercase text-xs">${calloutType}</span>
          </div>
          <div class="text-sm leading-relaxed">${parseInlineMarkdown(bodyText)}</div>
        </div>
      `);
      continue;
    }

    // Standard Blockquotes (> quote)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }
      const quoteContent = quoteLines.join('\n');
      const dir = resolveBlockDirection(quoteContent, globalDir);
      
      htmlBlocks.push(`
        <blockquote class="my-4 border-indigo-500/60 bg-neutral-900/40 p-4 rounded-r-lg italic text-neutral-300" dir="${dir}">
          ${parseInlineMarkdown(quoteContent)}
        </blockquote>
      `);
      continue;
    }

    // Headings (H1 - H6)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const dir = resolveBlockDirection(headingText, globalDir);
      const slug = headingText
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-') || `heading-${i}`;

      const sizes = [
        'text-3xl sm:text-4xl font-extrabold pb-3 border-b border-neutral-800 text-neutral-100 tracking-tight mt-8 mb-4',
        'text-2xl sm:text-3xl font-bold pb-2 border-b border-neutral-800/60 text-neutral-100 tracking-tight mt-7 mb-3',
        'text-xl sm:text-2xl font-bold text-neutral-200 mt-6 mb-2.5',
        'text-lg sm:text-xl font-semibold text-neutral-200 mt-5 mb-2',
        'text-base sm:text-lg font-semibold text-neutral-300 mt-4 mb-2',
        'text-sm sm:text-base font-medium text-neutral-400 uppercase tracking-wider mt-4 mb-2',
      ];
      const headingClass = sizes[level - 1] || sizes[2];

      htmlBlocks.push(`
        <h${level} id="${slug}" class="${headingClass} group flex items-baseline gap-2 scroll-mt-20" dir="${dir}">
          <span class="flex-1">${parseInlineMarkdown(headingText)}</span>
          <a href="#${slug}" class="opacity-0 group-hover:opacity-60 text-indigo-400 text-sm no-underline hover:opacity-100" aria-label="Link to heading">#</a>
        </h${level}>
      `);
      i++;
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      htmlBlocks.push('<hr class="my-8 border-neutral-800" />');
      i++;
      continue;
    }

    // Markdown Table (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0];
        const separatorRow = tableLines[1];
        const dataRows = tableLines.slice(2);

        const parseRow = (rowStr: string) => {
          return rowStr
            .slice(1, -1)
            .split('|')
            .map(c => c.trim());
        };

        const headers = parseRow(headerRow);
        const alignments = parseRow(separatorRow).map(sep => {
          const left = sep.startsWith(':');
          const right = sep.endsWith(':');
          if (left && right) return 'center';
          if (right) return 'right';
          return 'left';
        });

        // Table direction check
        const tableText = tableLines.join(' ');
        const tableDir = resolveBlockDirection(tableText, globalDir);

        let tableHtml = `<div class="my-6 overflow-x-auto rounded-xl border border-neutral-800 shadow-sm" dir="${tableDir}">`;
        tableHtml += `<table class="w-full text-sm text-neutral-200">`;
        tableHtml += `<thead class="bg-neutral-900 border-b border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-400"><tr>`;

        headers.forEach((h, idx) => {
          const align = alignments[idx] || 'left';
          const alignClass = align === 'center' ? 'text-center' : (align === 'right' ? 'text-right' : 'text-left');
          tableHtml += `<th class="px-4 py-3 ${alignClass}">${parseInlineMarkdown(h)}</th>`;
        });
        tableHtml += `</tr></thead><tbody class="divide-y divide-neutral-800/60 bg-neutral-950/50">`;

        dataRows.forEach((r, rowIdx) => {
          const cells = parseRow(r);
          tableHtml += `<tr class="${rowIdx % 2 === 1 ? 'bg-neutral-900/30' : ''} hover:bg-neutral-900/60 transition-colors">`;
          cells.forEach((cell, idx) => {
            const align = alignments[idx] || 'left';
            const alignClass = align === 'center' ? 'text-center' : (align === 'right' ? 'text-right' : 'text-left');
            tableHtml += `<td class="px-4 py-3 ${alignClass}">${parseInlineMarkdown(cell)}</td>`;
          });
          tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table></div>`;
        htmlBlocks.push(tableHtml);
        continue;
      }
    }

    // Task List Items (- [ ] or - [x])
    const taskMatch = line.match(/^(\s*)[-*+]\s*\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const taskText = taskMatch[3];
      const dir = resolveBlockDirection(taskText, globalDir);
      const currentTaskIndex = taskIndex++;

      htmlBlocks.push(`
        <div class="flex items-start gap-3 my-2 group pl-1 cursor-pointer" dir="${dir}">
          <input 
            type="checkbox" 
            ${isChecked ? 'checked' : ''} 
            data-task-index="${currentTaskIndex}"
            aria-label="Toggle task ${escapeHtml(taskText)}"
            class="interactive-task-cb mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer accent-indigo-500"
          />
          <span class="text-sm leading-relaxed ${isChecked ? 'line-through text-neutral-500' : 'text-neutral-200'}">
            ${parseInlineMarkdown(taskText)}
          </span>
        </div>
      `);
      i++;
      continue;
    }

    // Unordered & Ordered Lists
    const isBulletList = /^(\s*)[-*+]\s+(.*)$/.test(line);
    const isNumberList = /^(\s*)\d+[\.\)]\s+(.*)$/.test(line);

    if (isBulletList || isNumberList) {
      const listItems: { text: string; dir: 'rtl' | 'ltr' }[] = [];
      const isOrdered = isNumberList;

      while (i < lines.length) {
        const currLine = lines[i];
        const bMatch = currLine.match(/^(\s*)[-*+]\s+(.*)$/);
        const nMatch = currLine.match(/^(\s*)\d+[\.\)]\s+(.*)$/);

        if ((isOrdered && nMatch) || (!isOrdered && bMatch && !currLine.match(/^[-*+]\s*\[[ xX]\]/))) {
          const itemText = isOrdered ? nMatch![2] : bMatch![2];
          listItems.push({
            text: itemText,
            dir: resolveBlockDirection(itemText, globalDir),
          });
          i++;
        } else {
          break;
        }
      }

      const listTag = isOrdered ? 'ol' : 'ul';
      const listClass = isOrdered ? 'list-decimal' : 'list-disc';

      let listHtml = `<${listTag} class="${listClass} my-3 space-y-1.5 px-6 text-sm text-neutral-200">`;
      listItems.forEach(item => {
        listHtml += `<li dir="${item.dir}" class="leading-relaxed">${parseInlineMarkdown(item.text)}</li>`;
      });
      listHtml += `</${listTag}>`;

      htmlBlocks.push(listHtml);
      continue;
    }

    // Standard Paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('~~~') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('$$') &&
      !/^(\*{3,}|-{3,}|_{3,})$/.test(lines[i].trim()) &&
      !/^(\s*)[-*+]\s*\[[ xX]\]/.test(lines[i]) &&
      !/^(\s*)[-*+]\s+/.test(lines[i]) &&
      !/^(\s*)\d+[\.\)]\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    const paragraphText = paragraphLines.join(' ').trim();
    if (paragraphText) {
      const dir = resolveBlockDirection(paragraphText, globalDir);
      htmlBlocks.push(`
        <p class="my-3 text-sm sm:text-base leading-relaxed text-neutral-300 focus-paragraph" dir="${dir}">
          ${parseInlineMarkdown(paragraphText)}
        </p>
      `);
    }
  }

  return `<div class="markdown-body space-y-1">${htmlBlocks.join('\n')}</div>`;
}

/**
 * Helper to toggle a task checkbox in raw markdown text by its sequential task index
 */
export function toggleTaskInMarkdown(markdown: string, targetTaskIndex: number): string {
  let currentIndex = 0;
  return markdown.replace(/^(\s*[-*+]\s*\[)([ xX])(\]\s*.*)$/gm, (match, prefix, checkChar, rest) => {
    if (currentIndex === targetTaskIndex) {
      const newCheck = checkChar.toLowerCase() === 'x' ? ' ' : 'x';
      currentIndex++;
      return `${prefix}${newCheck}${rest}`;
    }
    currentIndex++;
    return match;
  });
}
