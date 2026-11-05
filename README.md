# OmniMark — Premium BiDi Markdown Editor

A high-performance Markdown editor with intelligent auto-direction (RTL/LTR),
live synchronized preview, focus mode, and a multi-document workspace.

Persian/Arabic and English each keep their own direction — per block, per
list item, per table cell — while code, math, and diagrams stay LTR.

## Quick start

```bash
bun install     # or: npm install
bun run dev     # Vite dev server on http://localhost:3000
bun run build   # production build into dist/
bun run preview # serve the production build locally
```

## Checks

```bash
bun run lint    # tsc --noEmit
bun run test    # node:test suite (BiDi engine, parser, stats)
```

CI (`.github/workflows/ci.yml`) runs install → lint → test → build on every
push and pull request.

## Features

- **BiDi auto-direction** — first-strong-character detection per block
  (`src/utils/bidi.ts`), with Persian/Arabic-Indic digits, diacritics, and
  tatweel correctly treated as neutral, not strong RTL.
- **Live preview** — hand-rolled BiDi-aware Markdown renderer
  (`src/utils/markdownParser.ts`): headings, lists, task lists, tables,
  callouts, fenced code, Mermaid diagrams, inline math, wiki links, tags.
- **Workspace** — multiple documents, snapshots, outline, knowledge graph,
  tags, find & replace, writing goals, readability stats.
- **Export** — standalone HTML, clean Markdown (+ YAML frontmatter), plain
  text, rich-text clipboard copy, print/PDF.
- **Persistence** — documents auto-save to `localStorage` (debounced,
  flushed on tab hide/unload, with a visible error banner if the write
  fails). Corrupt saved data is quarantined instead of crashing the app.

## Security notes

- Preview HTML is rendered with `dangerouslySetInnerHTML`, so it is defended
  in two layers: the parser escapes text and allowlists link/image URL
  schemes (`http/https/mailto`, relative, `#`; raster `data:` images only)
  and fenced-code languages, and `PreviewArea` additionally sanitizes the
  output with DOMPurify.
- Mermaid runs with `securityLevel: 'strict'` and is dynamically imported
  (it is not in the initial bundle).
- Document titles are escaped in every export path (standalone HTML, rich
  text, PDF container).
- `index.html` and exported HTML carry a Content-Security-Policy.
- No secrets are needed at runtime: `@google/genai` is currently unused
  (the AI Studio Gemini capability in `metadata.json` is not wired up —
  do not put a Gemini key in client code; it would ship in the bundle).

## Known limitations (honest list)

- The parser is hand-rolled, not CommonMark: no nested lists, no setext
  headings, no footnotes, no `<details>` blocks, no reference-style links,
  no autolinking, no raw-HTML blocks.
- Find & Replace highlights nothing (`onHighlightMatches` is a no-op) and
  "Replace" acts on the first match in the document, not the "current" one.
- Vazirmatn is loaded from Google Fonts at runtime; if that CDN is
  unreachable (notably from Iran), Persian falls back to the system font
  with no warning. Self-hosting the font is the planned fix.
- Word counts include code blocks and frontmatter; CJK text is undercounted
  (consecutive CJK characters count as one "word").
- Documents live only in the browser's `localStorage` (~5 MB quota, no
  sync, no encryption). Export backups regularly.

## Project layout

```
src/
  App.tsx                 workspace state, persistence, shortcuts
  components/             EditorArea, PreviewArea, Toolbar, Sidebar, modals…
  utils/
    bidi.ts               direction detection + BiDi stats
    markdownParser.ts     Markdown → BiDi-aware HTML
    markdownStats.ts      word counts, outline
    exporter.ts           HTML/Markdown/text/PDF export
    readability.ts tags.ts wikiLinks.ts
  data/defaultDocuments.ts
```

## License

Apache-2.0 — see `LICENSE`.
