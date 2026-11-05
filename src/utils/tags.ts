/**
 * Bear-style Tag Extraction Engine
 * Extracts #tags and #nested/tags while ignoring markdown headings (# Heading) and hex colors (#fff).
 */

export function extractTags(markdown: string): string[] {
  if (!markdown) return [];

  // Match #tag or #nested/tag preceded by whitespace or start of line,
  // NOT followed by a space (which is a heading # ), and NOT a valid 3-6 digit hex color code.
  const tagRegex = /(?:^|\s)#([a-zA-Z\u0600-\u06FF\u0590-\u05FF0-9_\/-]+)(?=\s|$|[.,!?;:])/g;
  const tags: string[] = [];

  let match;
  while ((match = tagRegex.exec(markdown)) !== null) {
    const rawTag = match[1].trim();

    // Skip if it looks like a hex color code (e.g. fff, 1a1a1a)
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(rawTag)) {
      continue;
    }

    // Skip pure numbers (e.g. #123)
    if (/^\d+$/.test(rawTag)) {
      continue;
    }

    if (!tags.includes(rawTag)) {
      tags.push(rawTag);
    }
  }

  return tags;
}

export function getAllTagsWithCounts(
  documents: { content: string }[]
): { tag: string; count: number }[] {
  const countMap = new Map<string, number>();

  for (const doc of documents) {
    const docTags = extractTags(doc.content);
    for (const tag of docTags) {
      countMap.set(tag, (countMap.get(tag) || 0) + 1);
    }
  }

  const result: { tag: string; count: number }[] = [];
  countMap.forEach((count, tag) => {
    result.push({ tag, count });
  });

  return result.sort((a, b) => b.count - a.count);
}
