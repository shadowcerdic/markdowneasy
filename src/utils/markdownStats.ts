/**
 * Markdown Statistics and Outline Extraction Engine
 */

export interface MarkdownStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  headingsCount: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export interface OutlineItem {
  id: string;
  level: number;
  text: string;
  lineNumber: number;
  direction: 'rtl' | 'ltr';
}

/**
 * Accurately counts words across multilingual scripts (Latin, Arabic, Hebrew, CJK).
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  // Match word sequences (Unicode letters, numbers, connectives)
  const matches = text.match(/[\p{L}\p{N}_-]+/gu);
  return matches ? matches.length : 0;
}

export function computeMarkdownStats(markdown: string): MarkdownStats {
  if (!markdown) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 1,
      paragraphs: 0,
      headingsCount: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    };
  }

  const characters = markdown.length;
  const charactersNoSpaces = markdown.replace(/\s/g, '').length;
  const lines = markdown.split(/\r\n|\r|\n/).length;
  
  // Non-empty paragraphs
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0).length;

  const words = countWords(markdown);

  // Count headings
  const headingsMatches = markdown.match(/^#{1,6}\s+.+$/gm);
  const headingsCount = headingsMatches ? headingsMatches.length : 0;

  // Reading time at ~200 words per minute, min 1 min if text exists
  const readingTimeMinutes = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
  // Speaking time at ~130 words per minute
  const speakingTimeMinutes = words > 0 ? Math.max(1, Math.ceil(words / 130)) : 0;

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    paragraphs,
    headingsCount,
    readingTimeMinutes,
    speakingTimeMinutes,
  };
}

/**
 * Extracts a hierarchical table of contents / outline from markdown
 */
export function extractOutline(markdown: string): OutlineItem[] {
  if (!markdown) return [];
  
  const lines = markdown.split(/\r\n|\r|\n/);
  const outline: OutlineItem[] = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim();
      // Clean inline markdown from outline text
      const cleanText = rawText
        .replace(/[*_~`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

      const slug = cleanText
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-') || `heading-${index}`;

      // Determine outline item direction
      const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC\u08A0-\u08FF]/.test(cleanText);

      outline.push({
        id: slug,
        level,
        text: cleanText,
        lineNumber: index + 1,
        direction: isRtl ? 'rtl' : 'ltr',
      });
    }
  });

  return outline;
}
