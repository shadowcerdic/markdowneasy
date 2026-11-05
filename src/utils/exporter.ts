/**
 * Comprehensive Export and Clipboard utility for OmniMark
 * Supports:
 * - Rich Formatted Text (direct paste into Google Docs, Word, Gmail, Telegram)
 * - Microsoft Word / DOCX-compatible HTML
 * - Standalone HTML with embedded Vazirmatn & BiDi engine
 * - Clean Markdown with optional YAML Frontmatter
 * - Plain Text (.txt)
 * - Formatted Print / PDF
 */

import { parseMarkdownToHtml, escapeHtml } from './markdownParser.ts';
import { calculateBidiStats } from './bidi.ts';
import { extractTags } from './tags.ts';

export function downloadFile(filename: string, content: string, contentType: string = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copies rich formatted HTML to clipboard so when pasting into
 * Google Docs, Word, Apple Notes, Gmail, it pastes with full formatting & fonts!
 */
export async function copyRichTextToClipboard(title: string, markdown: string, theme: string = 'dark'): Promise<boolean> {
  const renderedHtml = parseMarkdownToHtml(markdown);
  const bidiStats = calculateBidiStats(markdown);
  const docDir = bidiStats.dominantDirection;

  // Inlined styles for maximum compatibility with Word & Google Docs
  const styledHtml = `
    <div style="direction: ${docDir}; text-align: ${docDir === 'rtl' ? 'right' : 'left'}; font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #1e293b;">
      <h1 style="font-size: 24pt; margin-bottom: 12pt; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 6pt;">${escapeHtml(title)}</h1>
      ${renderedHtml}
    </div>
  `;

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const htmlBlob = new Blob([styledHtml], { type: 'text/html' });
      const textBlob = new Blob([markdown], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem write failed, trying fallback', err);
  }

  // Fallback to text copy
  try {
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = markdown;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Generates standalone HTML document with Vazirmatn web fonts and BiDi rules
 */
export function generateStandaloneHtml(title: string, markdown: string, theme: string = 'slate'): string {
  const renderedContent = parseMarkdownToHtml(markdown);
  const bidiStats = calculateBidiStats(markdown);
  const docDir = bidiStats.dominantDirection;

  const isLight = theme === 'paper' || theme === 'minimal';
  const bgColor = theme === 'paper' ? '#f8f5ee' : theme === 'minimal' ? '#ffffff' : '#090d16';
  const textColor = theme === 'paper' ? '#2b2723' : theme === 'minimal' ? '#18181b' : '#f1f5f9';
  const surfaceColor = theme === 'paper' ? '#ede7db' : theme === 'minimal' ? '#f4f4f5' : '#131b2e';
  const borderColor = theme === 'paper' ? '#ddd5c5' : theme === 'minimal' ? '#e4e4e7' : '#1e293b';

  return `<!DOCTYPE html>
<html lang="${docDir === 'rtl' ? 'fa' : 'en'}" dir="${docDir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; object-src 'none'; base-uri 'self'">
  <title>${escapeHtml(title || 'Exported Document - OmniMark')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${bgColor};
      --text: ${textColor};
      --surface: ${surfaceColor};
      --border: ${borderColor};
      --accent: #6366f1;
    }
    * { box-sizing: border-box; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.8;
      padding: 3rem 1.5rem;
      margin: 0 auto;
      max-width: 860px;
      -webkit-font-smoothing: antialiased;
    }
    [dir="rtl"],
    [dir="rtl"] h1, [dir="rtl"] h2, [dir="rtl"] h3, [dir="rtl"] h4, [dir="rtl"] h5, [dir="rtl"] h6,
    [dir="rtl"] p, [dir="rtl"] li, [dir="rtl"] td, [dir="rtl"] th, [dir="rtl"] blockquote {
      text-align: right;
      direction: rtl;
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    [dir="ltr"] { text-align: left; direction: ltr; }
    h1, h2, h3, h4, h5, h6 {
      color: inherit;
      margin-top: 1.75em;
      margin-bottom: 0.6em;
      font-weight: 700;
      line-height: 1.3;
    }
    h1 { font-size: 2.2em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
    h2 { font-size: 1.6em; }
    h3 { font-size: 1.3em; }
    p { margin: 1em 0; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre, code {
      font-family: 'Fira Code', monospace;
      direction: ltr !important;
      text-align: left !important;
    }
    code {
      background: var(--surface);
      padding: 0.2em 0.45em;
      border-radius: 6px;
      font-size: 0.88em;
      border: 1px solid var(--border);
    }
    pre {
      background: #020617;
      color: #e2e8f0;
      padding: 1.25rem;
      border-radius: 12px;
      overflow-x: auto;
      border: 1px solid var(--border);
      margin: 1.5em 0;
    }
    pre code { background: transparent; border: none; padding: 0; }
    blockquote {
      margin: 1.5em 0;
      padding: 0.8em 1.2em;
      background: var(--surface);
      border-radius: 8px;
    }
    [dir="ltr"] blockquote { border-left: 4px solid var(--accent); }
    [dir="rtl"] blockquote { border-right: 4px solid var(--accent); }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.75em 1em;
    }
    th {
      background: var(--surface);
      font-weight: 600;
    }
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2.5em 0;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
    }
    @media print {
      body {
        background: #fff !important;
        color: #000 !important;
        padding: 0;
        max-width: 100%;
      }
      pre { border: 1px solid #ccc; background: #f8f9fa; color: #000; }
      blockquote { background: #f1f5f9; }
    }
  </style>
</head>
<body>
  <header style="margin-bottom: 2.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
    <h1 style="margin: 0 0 0.5rem 0;">${escapeHtml(title)}</h1>
    <div style="font-size: 0.85em; opacity: 0.7;">Exported from OmniMark · Font: Vazirmatn (وزیرمتن)</div>
  </header>
  <main class="markdown-body">
    ${renderedContent}
  </main>
</body>
</html>`;
}

/**
 * Generates clean Markdown with optional YAML frontmatter
 */
export function generateCleanMarkdown(
  title: string,
  content: string,
  includeFrontmatter: boolean = true
): string {
  if (!includeFrontmatter) return content;

  const tags = extractTags(content);
  const bidi = calculateBidiStats(content);
  const dateStr = new Date().toISOString().split('T')[0];

  const frontmatter = [
    '---',
    // Escape backslashes before quotes and strip CR/LF: a title with a
    // newline previously broke out of the YAML string (frontmatter injection).
    `title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, ' ')}"`,
    `date: "${dateStr}"`,
    `direction: "${bidi.dominantDirection}"`,
    tags.length > 0 ? `tags: [${tags.map((t) => `"${t}"`).join(', ')}]` : null,
    'generator: "OmniMark Premium BiDi Editor"',
    '---',
    '',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  return frontmatter + content;
}

/**
 * Strips markdown formatting into clean plain text
 */
export function generatePlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/~~(.+?)~~/g, '$1') // strike
    .replace(/==(.+?)==/g, '$1') // highlight
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images
    .replace(/^\s*[-*+]\s+/gm, '• ') // bullet list
    .replace(/^\s*\d+\.\s+/gm, '') // numbered list
    .replace(/^\s*>\s*/gm, '') // quotes
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2 || $1') // wiki links
    .trim();
}

/**
 * Direct client-side PDF generation:
 * 1. Creates an off-screen, high-res HTML container with Vazirmatn fonts, BiDi layout, and print CSS
 * 2. Uses html2pdf.js to render and trigger a direct file download of the PDF
 * 3. Falls back gracefully to print dialog / iframe if html2canvas/html2pdf encounters restrictions
 */
export async function exportToPdf(title: string, markdown: string, theme: string = 'slate'): Promise<boolean> {
  const renderedContent = parseMarkdownToHtml(markdown);
  const bidiStats = calculateBidiStats(markdown);
  const docDir = bidiStats.dominantDirection;
  const sanitizedTitle = (title.trim() || 'Document').replace(/[^\w\s\u0600-\u06FF-]/gi, '_');

  // Create temporary container
  const container = document.createElement('div');
  container.id = 'omnimark-pdf-render-root';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // Standard A4 width at 96 DPI
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-1000';
  container.setAttribute('dir', docDir);

  const fontFam = "'Vazirmatn', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  container.innerHTML = `
    <div style="font-family: ${fontFam}; direction: ${docDir}; text-align: ${docDir === 'rtl' ? 'right' : 'left'}; line-height: 1.8; color: #111827;">
      <div style="margin-bottom: 24px; padding-bottom: 14px; border-bottom: 2px solid #e5e7eb;">
        <h1 style="font-size: 24pt; margin: 0 0 6px 0; font-weight: 800; color: #0f172a; font-family: ${fontFam};">${escapeHtml(title || 'Untitled Document')}</h1>
        <div style="font-size: 9pt; color: #64748b; font-family: ${fontFam};">OmniMark Premium BiDi Export · Font: Vazirmatn (وزیرمتن) · ${new Date().toLocaleDateString()}</div>
      </div>
      <div class="markdown-body" style="font-family: ${fontFam}; font-size: 11pt;">
        ${renderedContent}
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Dynamic import of html2pdf.js
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [12, 12, 12, 12] as [number, number, number, number],
      filename: `${sanitizedTitle}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        // useCORS:true made the victim's browser fetch arbitrary remote
        // images from a pasted document (intranet/tracking URLs) and embed
        // them in the PDF. Same-origin/data images render without it.
        useCORS: false,
        letterRendering: true,
        logging: false,
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(container).save();
    return true;
  } catch (err) {
    console.warn('html2pdf failed, attempting print fallback:', err);
    // Fallback: trigger standard browser print dialog
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
