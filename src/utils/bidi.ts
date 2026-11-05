/**
 * Bi-directional (BiDi) Text & Auto-Direction Engine for Markdown
 * Supports Arabic, Hebrew, Persian/Farsi, Urdu, Syriac, Thaana, and other RTL scripts.
 */

// Unicode ranges for strong RTL characters:
// Arabic (including Arabic Supplement, Extended-A, Presentation Forms-A & B)
// Hebrew (including Presentation Forms)
// Syriac, Thaana, NKo, Samaritan, Mandaic, Adlam, etc.
const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC\u08A0-\u08FF\u200F\u202B\u202E]/;

// Strong LTR characters (Latin, Cyrillic, Greek, Devanagari, Hangul, CJK, etc.)
const LTR_REGEX = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

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
 */
export function detectMarkdownLineDirection(line: string, defaultDirection: 'rtl' | 'ltr' = 'ltr'): 'rtl' | 'ltr' {
  const stripped = stripMarkdownPrefixes(line);
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
  const rtlPercentage = strongChars > 0 ? Math.round((rtlChars / strongChars) * 100) : 0;
  const ltrPercentage = strongChars > 0 ? Math.round((ltrChars / strongChars) * 100) : 100;
  const dominantDirection: 'rtl' | 'ltr' = rtlChars > ltrChars ? 'rtl' : 'ltr';

  let scriptSummary = 'English (LTR)';
  if (rtlPercentage > 75) {
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
