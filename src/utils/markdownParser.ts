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

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * URL allowlist for href/src attributes interpolated into HTML.
 * `escapeHtml` alone cannot stop `javascript:` / `data:text/html` links:
 * the scheme survives entity-escaping and executes on click. Only these
 * schemes (plus relative URLs and fragment links) are rendered; anything
 * else degrades to "#" so a malicious pasted document cannot phish or
 * execute code from the preview. Images additionally allow same-type
 * raster data: URIs (SVG data: URIs can carry scripts, so they are out).
 */
export function safeUrl(rawUrl: string, allowDataImages = false): string {
  const url = rawUrl.trim();
  if (url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return url;
  }
  const lower = url.toLowerCase();
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:')
  ) {
    return url;
  }
  if (allowDataImages && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(url)) {
    return url;
  }
  return '#';
}

/**
 * Fenced-code language label allowlist. The label is interpolated into
 * markup (`<span>${lang}</span>`, `class="language-${lang}"`), so a raw
 * fence like ```<img src=x onerror=...> was stored XSS. Only a
 * token-shaped language survives; anything else falls back to "text".
 */
function safeLanguage(rawLang: string): string {
  const lang = rawLang.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9+#.-]*$/.test(lang) ? lang : 'text';
}

/**
 * Emphasis passes (highlight, bold, italic, strikethrough, superscript).
 * Shared by parseInlineMarkdown and link labels: a label is stashed inside
 * its anchor before the main passes run, so its emphasis must be applied
 * here first — otherwise [**bold**](url) showed literal asterisks.
 * Input must already be HTML-escaped; these passes only add tags.
 */
function applyInlineEmphasis(text: string): string {
  return text
    .replace(/==([^=]+)==/g, '<mark class="bg-amber-400/25 text-amber-200 px-1 py-0.5 rounded border-b border-amber-400/50">$1</mark>')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-100">$1</strong>')
    .replace(/__([^_]+)__/g, '<strong class="font-semibold text-neutral-100">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic text-neutral-200">$1</em>')
    .replace(/_([^_]+)_/g, '<em class="italic text-neutral-200">$1</em>')
    .replace(/~~([^~]+)~~/g, '<del class="line-through text-neutral-400">$1</del>')
    .replace(/\^([^^]+)\^/g, '<sup class="text-[0.75em] text-neutral-300">$1</sup>');
}

/**
 * Links & images with balanced-paren destinations. A naive `\(([^)]+)\)`
 * stops at the FIRST ")" — so a legit Wikipedia URL with parens, or a
 * hostile `data:text/html,<script>alert(1)</script>` URL, left a visible
 * "</script>)" fragment in the preview. Scan the parens properly.
 *
 * Generated tags are NOT inlined directly: they go through `stash`, which
 * replaces them with a placeholder until the very end of
 * parseInlineMarkdown. Otherwise the bold/italic passes below would
 * rewrite underscores inside generated attributes — e.g. the `_` in a
 * Wikipedia URL paired with the `_` in `target="_blank"` and produced
 * `<a href="...X<em>(disambiguation)" target="</em>blank"...>`.
 */
function replaceLinksAndImages(text: string, stash: (html: string) => string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('[', i);
    if (open === -1) {
      out += text.slice(i);
      break;
    }
    const isImage = open > 0 && text[open - 1] === '!';
    const closeBracket = text.indexOf(']', open + 1);
    if (closeBracket === -1 || text[closeBracket + 1] !== '(' || (!isImage && closeBracket === open + 1)) {
      out += text.slice(i, open + 1);
      i = open + 1;
      continue;
    }
    let depth = 1;
    let j = closeBracket + 2;
    while (j < text.length && depth > 0) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') depth--;
      j++;
    }
    if (depth !== 0) {
      // Unterminated destination: leave it literal.
      out += text.slice(i, open + 1);
      i = open + 1;
      continue;
    }
    const label = text.slice(open + 1, closeBracket);
    const url = text.slice(closeBracket + 2, j - 1);
    if (isImage) {
      out += text.slice(i, open - 1); // drop the '!'
      out += stash(
        `<img src="${safeUrl(url, true)}" alt="${label}" class="rounded-xl border border-neutral-700/50 my-3 max-w-full shadow-md object-cover hover:opacity-95 transition-opacity" loading="lazy" />`
      );
    } else {
      out += text.slice(i, open);
      out += stash(
        `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 font-medium transition-colors">${applyInlineEmphasis(label)}</a>`
      );
    }
    i = j;
  }
  return out;
}

/**
 * Parses inline markdown: bold, italic, strikethrough, highlight, code, math, links, images, sub/sup.
 */
export function parseInlineMarkdown(text: string): string {
  // Every piece of generated HTML (code spans, math, links, images) is
  // stashed behind a placeholder until the very end. Otherwise the
  // bold/italic passes below rewrite markdown *inside* generated tags:
  // `**x**` became bold inside <code>, and the `_` in a Wikipedia URL
  // paired with the `_` in target="_blank" and broke the link entirely.
  const htmlParts: string[] = [];
  const stash = (html: string): string => {
    htmlParts.push(html);
    return `\u0000${htmlParts.length - 1}\u0000`;
  };

  // Extract inline code spans FIRST: otherwise the bold/italic/link
  // regexes below rewrite markdown *inside* code spans.
  let result = escapeHtml(text).replace(/`([^`]+)`/g, (_match, code) => {
    return stash(
      `<code class="px-1.5 py-0.5 rounded-md bg-neutral-800 border border-neutral-700/60 font-mono text-xs text-amber-300 font-medium inline-block" dir="ltr">${code}</code>`
    );
  });

  // Math inline: $expression$ (stashed: an expr like $a_b + c_d$ must not
  // be rewritten by the italic pass).
  result = result.replace(/\$([^\$\n]+)\$/g, (_match, expr) => {
    return stash(
      `<span class="inline-math px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 font-mono text-xs select-all" dir="ltr">LaTeX: ${expr}</span>`
    );
  });

  // Images & links: ![alt](url) / [text](url) — URL scheme-allowlisted
  // (see safeUrl) and destinations parsed with balanced parens.
  result = replaceLinksAndImages(result, stash);

  // Highlight, bold, italic, strikethrough, superscript
  result = applyInlineEmphasis(result);

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

  // Restore all stashed HTML (code spans, math, links, images),
  // untouched by the inline-formatting passes above.
  if (htmlParts.length > 0) {
    result = result.replace(/\u0000(\d+)\u0000/g, (_match, idx) => htmlParts[Number(idx)] ?? '');
  }

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

/** A separator row looks like | --- | :--: | ---: | (one cell per column). */
function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false;
  const cells = trimmed.slice(1, -1).split('|');
  return cells.length > 0 && cells.every(c => /^\s*:?-+:?\s*$/.test(c));
}

/** A table starts with a | ... | header line followed by a separator row. */
function isTableStart(lines: string[], i: number): boolean {
  const trimmed = lines[i].trim();
  return (
    trimmed.startsWith('|') &&
    trimmed.endsWith('|') &&
    i + 1 < lines.length &&
    isSeparatorRow(lines[i + 1])
  );
}

/**
 * Splits a table row into cells, honouring \| escapes and backtick code
 * spans — a naive split('|' ) broke `x|y` and escaped pipes into extra cells.
 */
function parseTableRow(rowStr: string): string[] {
  const inner = rowStr.trim().slice(1, -1);
  const cells: string[] = [];
  let current = '';
  let k = 0;
  while (k < inner.length) {
    const ch = inner[k];
    if (ch === '\\' && inner[k + 1] === '|') {
      current += '|';
      k += 2;
      continue;
    }
    if (ch === '`') {
      let run = 1;
      while (inner[k + run] === '`') run++;
      const fence = '`'.repeat(run);
      const closer = inner.indexOf(fence, k + run);
      if (closer !== -1) {
        current += inner.slice(k, closer + run);
        k = closer + run;
        continue;
      }
      current += fence;
      k += run;
      continue;
    }
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      k++;
      continue;
    }
    current += ch;
    k++;
  }
  cells.push(current.trim());
  return cells;
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
  const usedSlugs = new Set<string>();

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
      const lang = safeLanguage(fenceMatch && fenceMatch[2] ? fenceMatch[2].trim() : 'text');
      
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
      const firstContent = trimmed.slice(2);
      i++;
      const mathLines: string[] = [];
      if (firstContent.endsWith('$$')) {
        const content = firstContent.slice(0, -2).trim();
        if (content) mathLines.push(content);
      } else {
        // Content on the opening $$ line is part of the equation too.
        if (firstContent.trim()) mathLines.push(firstContent);
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
        <blockquote class="my-4 border-s-4 border-indigo-500/60 bg-neutral-900/40 p-4 rounded-s-lg italic text-neutral-300" dir="${dir}">
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
      const baseSlug =
        headingText
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .replace(/\s+/g, '-') || `heading-${i}`;
      // Duplicate headings must not share an id: the outline's
      // querySelector(`#slug`) would always land on the first one.
      let slug = baseSlug;
      let suffix = 2;
      while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
      usedSlugs.add(slug);

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
    // A table only starts when the NEXT line is a separator row (| --- | :--: |).
    // Without this check a lone "| text |" line was consumed but never rendered
    // (vanished from the preview), and a separator-less two-line table silently
    // ate its first data row as the "separator".
    if (isTableStart(lines, i)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const headerRow = tableLines[0];
      const separatorRow = tableLines[1];
      const dataRows = tableLines.slice(2);

      const headers = parseTableRow(headerRow);
      const alignments = parseTableRow(separatorRow).map(sep => {
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
        tableHtml += `<th dir="${detectDirection(h)}" class="px-4 py-3 ${alignClass}">${parseInlineMarkdown(h)}</th>`;
      });
      tableHtml += `</tr></thead><tbody class="divide-y divide-neutral-800/60 bg-neutral-950/50">`;

      dataRows.forEach((r, rowIdx) => {
        const cells = parseTableRow(r);
        tableHtml += `<tr class="${rowIdx % 2 === 1 ? 'bg-neutral-900/30' : ''} hover:bg-neutral-900/60 transition-colors">`;
        cells.forEach((cell, idx) => {
          const align = alignments[idx] || 'left';
          const alignClass = align === 'center' ? 'text-center' : (align === 'right' ? 'text-right' : 'text-left');
          tableHtml += `<td dir="${detectDirection(cell)}" class="px-4 py-3 ${alignClass}">${parseInlineMarkdown(cell)}</td>`;
        });
        tableHtml += `</tr>`;
      });

      tableHtml += `</tbody></table></div>`;
      htmlBlocks.push(tableHtml);
      continue;
    }

    // Task List Items (- [ ] or - [x]) — consecutive tasks are grouped
    // into one <ul> (previously each task was a bare <div>, so screen
    // readers saw no list and tasks could not be styled as one).
    const taskMatch = line.match(/^(\s*)[-*+]\s*\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const tasks: { checked: boolean; text: string; dir: 'rtl' | 'ltr'; index: number }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[-*+]\s*\[([ xX])\]\s*(.*)$/);
        if (!m) break;
        const taskText = m[3];
        tasks.push({
          checked: m[2].toLowerCase() === 'x',
          text: taskText,
          dir: resolveBlockDirection(taskText, globalDir),
          index: taskIndex++,
        });
        i++;
      }
      const taskItems = tasks
        .map(
          (t) => `
        <li class="flex items-start gap-3 my-2 group ps-1 cursor-pointer" dir="${t.dir}">
          <input
            type="checkbox"
            ${t.checked ? 'checked' : ''}
            data-task-index="${t.index}"
            aria-label="Toggle task ${escapeHtml(t.text)}"
            class="interactive-task-cb mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer accent-indigo-500"
          />
          <span class="text-sm leading-relaxed ${t.checked ? 'line-through text-neutral-500' : 'text-neutral-200'}">
            ${parseInlineMarkdown(t.text)}
          </span>
        </li>`
        )
        .join('\n');
      htmlBlocks.push(`<ul class="task-list my-2 list-none ps-0">${taskItems}\n</ul>`);
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
      // The container itself needs a direction: with no dir on <ol>/<ul>
      // it inherits LTR from <html>, so RTL items get their markers on the
      // wrong side and the number+dot run reorders (". 1" instead of "1.").
      // Majority direction of the items wins; each <li> keeps its own dir.
      const rtlCount = listItems.filter((item) => item.dir === 'rtl').length;
      const listDir = rtlCount * 2 > listItems.length ? 'rtl' : 'ltr';

      let listHtml = `<${listTag} dir="${listDir}" class="${listClass} my-3 space-y-1.5 ps-6 text-sm text-neutral-200">`;
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
      !isTableStart(lines, i) &&
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
 * Helper to toggle a task checkbox in raw markdown text by its sequential task index.
 * Must count tasks exactly like parseMarkdownToHtml does: task-looking lines
 * inside fenced code blocks or math blocks are content, not tasks, and counting
 * them here would toggle the wrong line (silent document corruption).
 */
export function toggleTaskInMarkdown(markdown: string, targetTaskIndex: number): string {
  // Split with captured separators so the document's original line endings
  // (CRLF included) survive the round-trip untouched.
  const parts = markdown.split(/(\r\n|\r|\n)/);
  let currentIndex = 0;
  let fenceMarker: string | null = null;
  let inMathBlock = false;

  for (let i = 0; i < parts.length; i += 2) {
    const trimmed = parts[i].trim();

    if (fenceMarker !== null) {
      if (trimmed.startsWith(fenceMarker)) fenceMarker = null;
      continue;
    }
    if (inMathBlock) {
      if (trimmed.endsWith('$$')) inMathBlock = false;
      continue;
    }

    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      fenceMarker = fenceMatch[1];
      continue;
    }
    if (trimmed.startsWith('$$')) {
      // Single-line $$...$$ stays on this line; otherwise the block runs
      // until a line ending with $$ (mirrors the parser).
      if (!(trimmed.length > 2 && trimmed.endsWith('$$'))) inMathBlock = true;
      continue;
    }

    const taskMatch = parts[i].match(/^(\s*[-*+]\s*\[)([ xX])(\]\s*.*)$/);
    if (taskMatch) {
      if (currentIndex === targetTaskIndex) {
        const newCheck = taskMatch[2].toLowerCase() === 'x' ? ' ' : 'x';
        parts[i] = `${taskMatch[1]}${newCheck}${taskMatch[3]}`;
      }
      currentIndex++;
    }
  }

  return parts.join('');
}
