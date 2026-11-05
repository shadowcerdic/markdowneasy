import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDirection,
  detectMarkdownLineDirection,
  stripMarkdownPrefixes,
  calculateBidiStats,
} from './bidi.ts';
import {
  countWords,
  computeMarkdownStats,
  extractOutline,
} from './markdownStats.ts';
import {
  parseMarkdownToHtml,
  toggleTaskInMarkdown,
} from './markdownParser.ts';

test('detectDirection identifies RTL and LTR correctly', () => {
  assert.equal(detectDirection('Hello World'), 'ltr');
  assert.equal(detectDirection('مرحبا بالعالم'), 'rtl');
  assert.equal(detectDirection('שלום עולם'), 'rtl');
  assert.equal(detectDirection('12345'), 'ltr'); // default fallback
});

test('stripMarkdownPrefixes removes markdown tokens accurately', () => {
  assert.equal(stripMarkdownPrefixes('### مرحباً بك'), 'مرحباً بك');
  assert.equal(stripMarkdownPrefixes('- [ ] مهمة جديدة'), 'مهمة جديدة');
  assert.equal(stripMarkdownPrefixes('> اقتباس رائع'), 'اقتباس رائع');
  assert.equal(stripMarkdownPrefixes('1. أولاً وقبل كل شيء'), 'أولاً وقبل كل شيء');
  assert.equal(stripMarkdownPrefixes('| جدول البيانات |'), 'جدول البيانات |');
});

test('detectMarkdownLineDirection detects RTL for markdown headings and lists', () => {
  assert.equal(detectMarkdownLineDirection('### عنوان رئيسي'), 'rtl');
  assert.equal(detectMarkdownLineDirection('# Welcome to OmniMark'), 'ltr');
  assert.equal(detectMarkdownLineDirection('- [ ] إكمال المشروع اليوم'), 'rtl');
  assert.equal(detectMarkdownLineDirection('> משהו בעברית'), 'rtl');
});

test('calculateBidiStats accurately calculates percentages and script summary', () => {
  const arabicDoc = 'مرحبا بكم في محرر ماركداون الذكي';
  const stats1 = calculateBidiStats(arabicDoc);
  assert.equal(stats1.dominantDirection, 'rtl');
  assert.ok(stats1.rtlPercentage > 80);

  const mixedDoc = 'Hello world مرحبا بكم';
  const stats2 = calculateBidiStats(mixedDoc);
  assert.ok(stats2.rtlChars > 0);
  assert.ok(stats2.ltrChars > 0);
});

test('computeMarkdownStats calculates words, headings, and read time', () => {
  const doc = `# Title 1

This is a test paragraph with multiple words.

## Title 2

مرحبا بكم هنا`;
  
  const stats = computeMarkdownStats(doc);
  assert.equal(stats.headingsCount, 2);
  assert.ok(stats.words >= 10);
  assert.ok(stats.paragraphs >= 2);
  assert.ok(stats.readingTimeMinutes >= 1);
});

test('extractOutline extracts hierarchical outline with direction', () => {
  const doc = `# First Chapter
## مرحلة أولى
### Subsection`;
  
  const outline = extractOutline(doc);
  assert.equal(outline.length, 3);
  assert.equal(outline[0].level, 1);
  assert.equal(outline[0].direction, 'ltr');
  assert.equal(outline[1].level, 2);
  assert.equal(outline[1].direction, 'rtl');
});

test('parseMarkdownToHtml handles callouts, tasks, and bidi', () => {
  const doc = `> [!NOTE]
> ملاحظة هامة جداً

- [ ] Task 1
- [x] Task 2`;

  const html = parseMarkdownToHtml(doc);
  assert.ok(html.includes('[!NOTE]') === false); // converted to styled callout
  assert.ok(html.includes('NOTE'));
  assert.ok(html.includes('data-task-index="0"'));
  assert.ok(html.includes('checked'));
});

test('toggleTaskInMarkdown toggles checkbox state correctly', () => {
  const doc = `- [ ] Task 1\n- [x] Task 2`;
  const toggled = toggleTaskInMarkdown(doc, 0);
  assert.equal(toggled, `- [x] Task 1\n- [x] Task 2`);
});

test('extractWikiLinks and replaceWikiLinks parse Obsidian style links', async () => {
  const { extractWikiLinks, replaceWikiLinks, buildGraphData } = await import('./wikiLinks.ts');
  const markdown = 'Check [[Design System]] and [[Architecture Spec|Architecture]]';
  const links = extractWikiLinks(markdown);
  assert.deepEqual(links, ['Design System', 'Architecture Spec']);

  const html = replaceWikiLinks(markdown, ['Design System']);
  assert.ok(html.includes('wiki-link-target'));
  assert.ok(html.includes('Design System'));

  const docs = [
    { id: '1', title: 'Doc A', content: 'Links to [[Doc B]]' },
    { id: '2', title: 'Doc B', content: 'No links' },
  ];
  const graph = buildGraphData(docs, '1');
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.links.length, 1);
  assert.equal(graph.links[0].source, '1');
  assert.equal(graph.links[0].target, '2');
});

test('extractTags correctly identifies Bear-style tags while ignoring headings', async () => {
  const { extractTags, getAllTagsWithCounts } = await import('./tags.ts');
  const text = `# Heading 1\nThis has #react and #persian/vazir tags, but color #ff0000 and number #123 should be ignored.`;
  const tags = extractTags(text);
  assert.ok(tags.includes('react'));
  assert.ok(tags.includes('persian/vazir'));
  assert.ok(!tags.includes('Heading'));
  assert.ok(!tags.includes('ff0000'));
});

test('computeReadability calculates Flesch Reading Ease and sentences', async () => {
  const { computeReadability } = await import('./readability.ts');
  const sample = 'The quick brown fox jumps over the lazy dog. Simple prose is clear and direct.';
  const metrics = computeReadability(sample);
  assert.ok(metrics.fleschScore > 70);
  assert.equal(metrics.sentenceCount, 2);
});

test('parseMarkdownToHtml handles Mermaid diagrams', () => {
  const doc = "```mermaid\ngraph TD;\nA-->B;\n```";
  const html = parseMarkdownToHtml(doc);
  assert.ok(html.includes('Mermaid Diagram'));
  assert.ok(html.includes('mermaid'));
});
