import React, { useState, useEffect } from 'react';
import { Table, X, Check } from 'lucide-react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (tableMarkdown: string) => void;
}

export const TableModal: React.FC<TableModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    let markdown = '\n';
    
    // Header
    const headers: string[] = [];
    const separators: string[] = [];
    for (let c = 1; c <= cols; c++) {
      headers.push(`Header ${c}`);
      separators.push('---');
    }
    markdown += `| ${headers.join(' | ')} |\n`;
    markdown += `| ${separators.join(' | ')} |\n`;

    // Data rows
    for (let r = 1; r <= rows; r++) {
      const rowCells: string[] = [];
      for (let c = 1; c <= cols; c++) {
        rowCells.push(`Cell ${r},${c}`);
      }
      markdown += `| ${rowCells.join(' | ')} |\n`;
    }
    markdown += '\n';

    onInsert(markdown);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-neutral-200">
            <Table className="w-4 h-4 text-indigo-400" />
            <span>Insert Markdown Table</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close table modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="table-cols" className="text-neutral-300">Columns</label>
            <input 
              id="table-cols"
              type="number" 
              min={1} 
              max={10} 
              value={cols}
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-center text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="table-rows" className="text-neutral-300">Data Rows</label>
            <input 
              id="table-rows"
              type="number" 
              min={1} 
              max={25} 
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-center text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 pt-1">
            <input 
              type="checkbox" 
              checked={hasHeader} 
              onChange={(e) => setHasHeader(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-indigo-500"
            />
            <span>Include header row</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insert Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};
