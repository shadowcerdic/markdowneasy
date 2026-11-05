import React from 'react';
import { ListTree, X, Hash } from 'lucide-react';
import { extractOutline } from '../utils/markdownStats.ts';

interface OutlineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  onSelectHeading: (lineNumber: number, slug: string) => void;
}

export const OutlineDrawer: React.FC<OutlineDrawerProps> = ({
  isOpen,
  onClose,
  markdown,
  onSelectHeading,
}) => {
  if (!isOpen) return null;

  const outline = extractOutline(markdown);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
      />
      <div className="fixed inset-y-0 left-0 md:static z-40 md:z-20 w-72 shrink-0 border-r border-neutral-800 bg-neutral-900/98 shadow-2xl md:shadow-none flex flex-col h-full animate-fadeIn">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 font-semibold text-sm text-neutral-200">
          <ListTree className="w-4 h-4 text-indigo-400" />
          <span>Document Outline</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Close outline drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {outline.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 italic">
            No headings found in document. Type # Heading to generate an outline.
          </div>
        ) : (
          outline.map((item, idx) => {
            const paddingLeft = `${(item.level - 1) * 14 + 8}px`;
            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => onSelectHeading(item.lineNumber, item.id)}
                style={{ paddingLeft }}
                className="w-full text-left py-1.5 pr-2.5 rounded-lg text-xs hover:bg-neutral-800/80 transition-colors flex items-center justify-between group cursor-pointer text-neutral-300 hover:text-white"
              >
                <span className="flex items-center gap-1.5 truncate" dir={item.direction}>
                  <Hash className="w-3 h-3 text-neutral-500 shrink-0 group-hover:text-indigo-400" />
                  <span className="truncate">{item.text}</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-400 shrink-0 ml-2">
                  L{item.lineNumber}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
        <span>{outline.length} sections indexed</span>
        <span className="font-mono text-indigo-400/80">Auto-synced</span>
      </div>
    </div>
    </>
  );
};
