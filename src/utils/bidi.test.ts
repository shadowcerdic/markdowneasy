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
  parseInlineMarkdown,
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

// --- Regression tests for the deep-audit fixes (2026-11-05) ---

test('detectDirection: Persian digits and diacritics are neutral, not strong RTL', () => {
  // Persian/Arabic-Indic digits must be skipped, like Latin digits are.
  assert.equal(detectDirection('۱۲۳ Hello world'), 'ltr');
  assert.equal(detectDirection('١٢٣ Hello'), 'ltr');
  assert.equal(detectDirection('123 سلام دنیا'), 'rtl');
  // Leading diacritic alone must not decide direction.
  assert.equal(detectDirection('ًHello'), 'ltr');
  // Persian-specific letters (ی ک پ چ ژ گ) are strong RTL.
  assert.equal(detectDirection('می‌خواهم بروم'), 'rtl');
  assert.equal(detectDirection('پژوهش ژنتیک'), 'rtl');
  // Scripts the old LTR range omitted are LTR, not RTL-by-default.
  assert.equal(detectDirection('ภาษาไทย سلام'), 'ltr');
  assert.equal(detectDirection('Հայերեն سلام'), 'ltr');
});

test('detectMarkdownLineDirection ignores inline code, links and URLs', () => {
  assert.equal(detectMarkdownLineDirection('`code` سلام دنیا'), 'rtl');
  // Bold markers are stripped, so the visible Persian text decides.
  assert.equal(detectMarkdownLineDirection('**سلام** Hello'), 'rtl');
  assert.equal(detectMarkdownLineDirection('https://example.com سلام'), 'rtl');
  assert.equal(detectMarkdownLineDirection('[سلام](https://example.com) دنیا'), 'rtl');
  assert.equal(detectMarkdownLineDirection('#tag سلام دنیا'), 'rtl');
});

test('calculateBidiStats reports 0/0 when there are no strong characters', () => {
  const stats = calculateBidiStats('12345 !!!');
  assert.equal(stats.rtlPercentage, 0);
  assert.equal(stats.ltrPercentage, 0);
});

test('parseMarkdownToHtml: javascript: and data:text/html links are neutralised', () => {
  const html = parseMarkdownToHtml('[click me](javascript:alert(1))');
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('href="#"'));

  const html2 = parseMarkdownToHtml('[x](data:text/html,<script>alert(1)</script>)');
  assert.ok(!html2.includes('data:text/html'));

  const ok = parseMarkdownToHtml('[real](https://example.com) [mail](mailto:a@b.c)');
  assert.ok(ok.includes('href="https://example.com"'));
  assert.ok(ok.includes('href="mailto:a@b.c"'));
});

test('parseMarkdownToHtml: fenced-code language cannot break out of markup', () => {
  const html = parseMarkdownToHtml('```<img src=x onerror=alert(1)>\ncode\n```');
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('onerror'));
  assert.ok(html.includes('language-text'));
});

test('parseMarkdownToHtml: inline code is not rewritten by bold/link rules', () => {
  const html = parseMarkdownToHtml('Use `**not bold**` and `[not a link](https://x.test)` here.');
  assert.ok(html.includes('<code'), 'code span present');
  assert.ok(!html.includes('<strong>not bold</strong>'));
  assert.ok(!html.includes('href="https://x.test"'));
});

test('parseMarkdownToHtml: duplicate headings get unique ids', () => {
  const html = parseMarkdownToHtml('# Title\n\n# Title\n\n# Title');
  assert.ok(html.includes('id="title"'));
  assert.ok(html.includes('id="title-2"'));
  assert.ok(html.includes('id="title-3"'));
});

test('parseMarkdownToHtml: ordered list container carries the list direction', () => {
  const html = parseMarkdownToHtml('1. اول\n2. دوم\n3. سوم');
  assert.ok(html.includes('<ol dir="rtl"'));
  const htmlEn = parseMarkdownToHtml('1. first\n2. second');
  assert.ok(htmlEn.includes('<ol dir="ltr"'));
});

test('parseInlineMarkdown: underscores in a link URL do not pair with target="_blank" as italic', () => {
  const html = parseInlineMarkdown('[wiki](https://en.wikipedia.org/wiki/Some_Page) and _real italic_');
  assert.ok(html.includes('href="https://en.wikipedia.org/wiki/Some_Page"'));
  assert.ok(html.includes('target="_blank"'));
  assert.ok(!html.includes('target="</em>'));
  assert.ok(html.includes('<em class="italic text-neutral-200">real italic</em>'));
});

test('parseMarkdownToHtml: URLs with parentheses parse fully, no leftover fragments', () => {
  const html = parseMarkdownToHtml('[wiki](https://en.wikipedia.org/wiki/X_(disambiguation))');
  assert.ok(html.includes('href="https://en.wikipedia.org/wiki/X_(disambiguation)"'));
  assert.ok(!html.includes('(disambiguation))'));

  const evil = parseMarkdownToHtml('![evil](data:text/html,<script>alert(1)</script>)');
  assert.ok(!evil.includes('</script>'));
  assert.ok(!evil.includes('alert(1)'));
  assert.ok(evil.includes('src="#"'));
});

test('parseMarkdownToHtml: consecutive tasks form one list', () => {
  const html = parseMarkdownToHtml('- [ ] one\n- [x] two\n- [ ] three');
  assert.ok(html.includes('<ul class="task-list'));
  assert.equal((html.match(/<li/g) || []).length, 3);
  assert.ok(html.includes('data-task-index="0"'));
  assert.ok(html.includes('data-task-index="2"'));
});

// --- Regression tests for the 2026-11-07 review fixes ---

test('toggleTaskInMarkdown: task-looking lines inside code fences are not tasks', () => {
  const doc = '```\n- [ ] fake task in code\n```\n\n- [ ] real task one\n- [x] real task two';
  const toggled = toggleTaskInMarkdown(doc, 0);
  assert.ok(toggled.includes('- [ ] fake task in code'), 'code content untouched');
  assert.ok(toggled.includes('- [x] real task one'), 'first real task toggled');
  assert.ok(toggled.includes('- [x] real task two'), 'second task untouched');

  const tilde = '~~~\n- [ ] fake\n~~~\n- [ ] real';
  assert.ok(toggleTaskInMarkdown(tilde, 0).includes('- [ ] fake'));
  assert.ok(toggleTaskInMarkdown(tilde, 0).includes('- [x] real'));
});

test('toggleTaskInMarkdown: task-looking lines inside math blocks are not tasks', () => {
  const doc = '$$\n- [ ] fake math line\n$$\n\n- [ ] real task';
  const toggled = toggleTaskInMarkdown(doc, 0);
  assert.ok(toggled.includes('- [ ] fake math line'));
  assert.ok(toggled.includes('- [x] real task'));

  const singleLine = '$$ - [ ] fake $$\n- [ ] real';
  assert.ok(toggleTaskInMarkdown(singleLine, 0).includes('$$ - [ ] fake $$'));
  assert.ok(toggleTaskInMarkdown(singleLine, 0).includes('- [x] real'));
});

test('toggleTaskInMarkdown: preserves CRLF line endings', () => {
  const doc = '- [ ] one\r\n- [x] two\r\n';
  assert.equal(toggleTaskInMarkdown(doc, 0), '- [x] one\r\n- [x] two\r\n');
});

test('parseMarkdownToHtml: a lone | line is rendered, not swallowed', () => {
  const html = parseMarkdownToHtml('BEFORE\n\n| just a pipe line |\n\nAFTER');
  assert.ok(html.includes('just a pipe line'));
  assert.ok(html.includes('BEFORE'));
  assert.ok(html.includes('AFTER'));
});

test('parseMarkdownToHtml: table without a separator row keeps all its lines', () => {
  const html = parseMarkdownToHtml('| a | b |\n| real data | more data |');
  assert.ok(html.includes('real data'), 'second line must not be eaten as a separator');
  assert.ok(html.includes('more data'));
  assert.ok(!html.includes('<table'), 'not a valid table');
});

test('parseMarkdownToHtml: valid tables still parse with alignments', () => {
  const html = parseMarkdownToHtml('| a | b |\n| :--- | ---: |\n| x | y |');
  assert.ok(html.includes('<table'));
  assert.ok(html.includes('text-left'));
  assert.ok(html.includes('text-right'));
  assert.equal((html.match(/<td/g) || []).length, 2);
});

test('parseMarkdownToHtml: escaped pipes and code-span pipes do not split cells', () => {
  const html = parseMarkdownToHtml('| a | b |\n| --- | --- |\n| `x|y` | z\\|w |');
  assert.equal((html.match(/<td/g) || []).length, 2);
  assert.ok(html.includes('x|y'));
  assert.ok(html.includes('z|w'));
});

test('parseMarkdownToHtml: content on the opening $$ line is kept', () => {
  const html = parseMarkdownToHtml('$$E = mc^2\nx + y = z\n$$');
  assert.ok(html.includes('E = mc^2'));
  assert.ok(html.includes('x + y = z'));

  const single = parseMarkdownToHtml('$$a^2 + b^2 = c^2$$');
  assert.ok(single.includes('a^2 + b^2 = c^2'));

  const bare = parseMarkdownToHtml('$$\nonly line\n$$');
  assert.ok(bare.includes('only line'));
});

test('parseMarkdownToHtml: emphasis inside link labels renders', () => {
  const html = parseMarkdownToHtml('[**bold label**](https://example.com)');
  assert.ok(html.includes('<strong class="font-semibold text-neutral-100">bold label</strong>'));
  assert.ok(!html.includes('**bold label**'));
  assert.ok(html.includes('href="https://example.com"'));

  const italic = parseMarkdownToHtml('[*slanted* and _under_](https://example.com)');
  assert.ok(italic.includes('<em class="italic text-neutral-200">slanted</em>'));
  assert.ok(italic.includes('<em class="italic text-neutral-200">under</em>'));
});

test('sanitizeFilename: Persian titles fall back to a dated ASCII name', async () => {
  const { sanitizeFilename } = await import('./exporter.ts');
  assert.equal(sanitizeFilename('سلام دنیا'), `document-${new Date().toISOString().slice(0, 10)}`);
  assert.equal(sanitizeFilename('گزارش Report 1404'), 'Report_1404');
  assert.equal(sanitizeFilename('  '), `document-${new Date().toISOString().slice(0, 10)}`);
});
