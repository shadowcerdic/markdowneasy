/**
 * Bi-directional (BiDi) Text & Auto-Direction Engine for Markdown
 * Supports Arabic, Hebrew, Persian/Farsi, Urdu, Syriac, Thaana, and other RTL scripts.
 */

// Unicode ranges for STRONG RTL letters only (Unicode Bidirectional
// Algorithm "strong" types R / AL). Digits, diacritics, tatweel (U+0640),
// ZWNJ/ZWJ and format controls (U+200E/U+200F, U+202A–U+202E, U+2066–U+2069)
// are weak/neutral and must NOT decide direction — the old blanket range
// U+0591–U+07FF counted Persian/Arabic-Indic digits (۱۲۳) as strong RTL,
// so "۱۲۳ Hello world" was misdetected as RTL.
const RTL_REGEX =
  /[\u05D0-\u05EA\u05F0-\u05F2\u0621-\u064A\u066E-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710-\u072F\u0750-\u077F\u0780-\u07B1\u07CA-\u07EA\u08A0-\u08B4\u08B6-\u08BD\uFB1D-\uFB4F\uFB50-\uFDFD\uFE70-\uFEFC]/;

// Strong LTR letters (Latin, Cyrillic, Greek, Armenian, Georgian, Thai,
// Lao, Ethiopic, Devanagari, Hangul, CJK, etc.)
const LTR_REGEX =
  /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0531-\u058F\u0E00-\u0E7F\u0E80-\u0EFF\u10A0-\u10FF\u1100-\u11FF\u1200-\u137C\u1780-\u17FF\u1C90-\u1CBF\u2D00-\u2D2F\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]/;

/**
 * Removes markdown block formatting symbols from the beginning of a line
 * so that headers (###), lists (*, -, 1.), blockquotes (>), tasks (- [ ]),
 * and table pipes (|) don't fool the first-strong-character direction check.
 */
export function stripMarkdownPrefixes(line: string): string {
  let cleaned = line.trim();
  
  // Strip blockquote markers: > > >
  cleaned = cleaned.replace(/^(?:>\s*)+/, '');
  
  // Strip heading markers: #, ##, ###, etc.
  cleaned = cleaned.replace(/^#{1,6}\s+/, '');
  
  // Strip task list markers: - [ ] or - [x] or * [ ]
  cleaned = cleaned.replace(/^[-*+]\s*\[[ xX]\]\s*/, '');
  
  // Strip unordered bullet markers: -, *, +
  cleaned = cleaned.replace(/^[-*+]\s+/, '');
  
  // Strip ordered list markers: 1., 2), etc.
  cleaned = cleaned.replace(/^\d+[\.\)]\s+/, '');
  
  // Strip table row starting pipe: |
  cleaned = cleaned.replace(/^\|\s*/, '');
  
  // Strip leading backticks or tildes: ``` or ~~~
  cleaned = cleaned.replace(/^(?:`{3,}|~{3,})\w*\s*/, '');

  return cleaned.trim();
}

/**
 * Detects the text direction of a string using the First Strong Character Rule.
 * If fallback is not specified, returns 'ltr' by default.
 */
export function detectDirection(text: string, defaultDirection: 'rtl' | 'ltr' = 'ltr'): 'rtl' | 'ltr' {
  if (!text) return defaultDirection;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (RTL_REGEX.test(char)) {
      return 'rtl';
    }
    if (LTR_REGEX.test(char)) {
      return 'ltr';
    }
  }

  return defaultDirection;
}

/**
 * Detects the direction of a single markdown line after stripping markdown markers.
 * Inline syntax is stripped too: a leading code span, bold marker, link URL
 * or bare URL must not decide the direction — the visible text decides it.
 * E.g. "`code` سلام دنیا" and "https://example.com سلام" are RTL.
 */
export function detectMarkdownLineDirection(line: string, defaultDirection: 'rtl' | 'ltr' = 'ltr'): 'rtl' | 'ltr' {
  let stripped = stripMarkdownPrefixes(line);
  // Inline code spans: keep nothing (they are LTR by construction, not prose)
  stripped = stripped.replace(/`[^`]*`/g, '');
  // Images -> alt text, links -> label text (the URL is not prose)
  stripped = stripped.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  stripped = stripped.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Bare URLs are not prose either
  stripped = stripped.replace(/(?:https?:\/\/|www\.)\S+/g, '');
  // Inline emphasis / strikethrough / highlight markers
  stripped = stripped.replace(/(\*\*|__|~~|==|\*|_)/g, '');
  // Leading @mentions and #tags are Latin lead-ins, not the sentence direction
  stripped = stripped.replace(/^(?:[@#][\w/-]+)\s+/g, '');
  stripped = stripped.trim();
  if (!stripped) return defaultDirection;
  return detectDirection(stripped, defaultDirection);
}

export interface BidiStats {
  rtlChars: number;
  ltrChars: number;
  neutralChars: number;
  totalChars: number;
  rtlPercentage: number;
  ltrPercentage: number;
  dominantDirection: 'rtl' | 'ltr';
  scriptSummary: string;
}

/**
 * Computes deep directional stats across a markdown document.
 */
export function calculateBidiStats(text: string): BidiStats {
  let rtlChars = 0;
  let ltrChars = 0;
  let neutralChars = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (RTL_REGEX.test(char)) {
      rtlChars++;
    } else if (LTR_REGEX.test(char)) {
      ltrChars++;
    } else {
      neutralChars++;
    }
  }

  const strongChars = rtlChars + ltrChars;
  // No strong characters: 0/0, not a fake "100% LTR" (the old code reported
  // ltrPercentage 100 for an empty / digits-only document).
  const rtlPercentage = strongChars > 0 ? Math.round((rtlChars / strongChars) * 100) : 0;
  const ltrPercentage = strongChars > 0 ? Math.round((ltrChars / strongChars) * 100) : 0;
  const dominantDirection: 'rtl' | 'ltr' = rtlChars > ltrChars ? 'rtl' : 'ltr';

  let scriptSummary = 'English (LTR)';
  if (strongChars === 0) {
    scriptSummary = 'No strong script characters';
  } else if (rtlPercentage > 75) {
    scriptSummary = 'Mainly RTL (Arabic/Hebrew)';
  } else if (rtlPercentage >= 25) {
    scriptSummary = `Mixed BiDi (${rtlPercentage}% RTL / ${ltrPercentage}% LTR)`;
  }

  return {
    rtlChars,
    ltrChars,
    neutralChars,
    totalChars: text.length,
    rtlPercentage,
    ltrPercentage,
    dominantDirection,
    scriptSummary,
  };
}
