/**
 * Obsidian-style Wiki-Link Parser and Knowledge Graph Builder
 */

export interface GraphNode {
  id: string;
  title: string;
  linksCount: number;
  isCurrent?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Extracts all [[Wiki Link]] titles from markdown text.
 */
export function extractWikiLinks(markdown: string): string[] {
  if (!markdown) return [];
  const matches = markdown.match(/\[\[([^\]]+)\]\]/g);
  if (!matches) return [];

  const links: string[] = [];
  for (const match of matches) {
    const raw = match.slice(2, -2).trim();
    // Support [[Target|Alias]]
    const target = raw.split('|')[0].trim();
    if (target && !links.includes(target)) {
      links.push(target);
    }
  }
  return links;
}

/**
 * Replaces [[Document Title]] or [[Document Title|Custom Label]] with clickable wiki links.
 */
export function replaceWikiLinks(
  content: string,
  existingTitles: string[] = []
): string {
  if (!content) return '';

  return content.replace(/\[\[([^\]]+)\]\]/g, (_fullMatch, inner) => {
    const parts = inner.split('|');
    const target = parts[0].trim();
    const label = (parts[1] || parts[0]).trim();

    const exists = existingTitles.some(
      (t) => t.toLowerCase() === target.toLowerCase()
    );

    const statusClass = exists
      ? 'text-indigo-400 hover:text-indigo-300 font-semibold border-b border-indigo-500/50 hover:border-indigo-400'
      : 'text-amber-400/80 hover:text-amber-300 underline decoration-dashed';

    return `<a href="#wiki:${encodeURIComponent(
      target
    )}" class="wiki-link-target inline-flex items-center gap-1 cursor-pointer transition-colors ${statusClass}" data-wiki-doc="${encodeURIComponent(
      target
    )}" title="${exists ? `Open document: ${target}` : `Document not found: ${target}`}"><span class="opacity-60 text-xs">⟦</span>${label}<span class="opacity-60 text-xs">⟧</span></a>`;
  });
}

/**
 * Generates nodes and links for an interactive Knowledge Graph across all documents.
 */
export function buildGraphData(
  documents: { id: string; title: string; content: string }[],
  currentDocId?: string
): KnowledgeGraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const titleToIdMap = new Map<string, string>();
  for (const doc of documents) {
    titleToIdMap.set(doc.title.trim().toLowerCase(), doc.id);
  }

  for (const doc of documents) {
    const outgoing = extractWikiLinks(doc.content);
    nodes.push({
      id: doc.id,
      title: doc.title,
      linksCount: outgoing.length,
      isCurrent: doc.id === currentDocId,
    });

    for (const targetTitle of outgoing) {
      const targetId = titleToIdMap.get(targetTitle.toLowerCase());
      if (targetId && targetId !== doc.id) {
        // Avoid duplicate links
        const linkExists = links.some(
          (l) => l.source === doc.id && l.target === targetId
        );
        if (!linkExists) {
          links.push({
            source: doc.id,
            target: targetId,
          });
        }
      }
    }
  }

  return { nodes, links };
}
