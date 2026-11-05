import React, { useEffect, useRef, useState } from 'react';
import { X, Network, Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { buildGraphData, GraphNode } from '../utils/wikiLinks.ts';
import { DocumentItem } from '../data/defaultDocuments.ts';

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  currentDocId: string;
  onSelectDoc: (id: string) => void;
}

export const GraphModal: React.FC<GraphModalProps> = ({
  isOpen,
  onClose,
  documents,
  currentDocId,
  onSelectDoc,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const graphData = buildGraphData(documents, currentDocId);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Node physics coordinates
    interface SimNode extends GraphNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const simNodes: SimNode[] = graphData.nodes.map((n, idx) => {
      const angle = (idx / Math.max(1, graphData.nodes.length)) * 2 * Math.PI;
      const dist = 120 + (idx % 2) * 50;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: n.isCurrent ? 14 : Math.min(22, 9 + n.linksCount * 3),
      };
    });

    // Simple force layout simulation
    const simulate = () => {
      // Center gravity
      for (const node of simNodes) {
        node.vx += (width / 2 - node.x) * 0.005;
        node.vy += (height / 2 - node.y) * 0.005;
      }

      // Repulsion between nodes
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const dx = simNodes[j].x - simNodes[i].x;
          const dy = simNodes[j].y - simNodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / dist * 0.04;
            simNodes[i].vx -= dx * force;
            simNodes[i].vy -= dy * force;
            simNodes[j].vx += dx * force;
            simNodes[j].vy += dy * force;
          }
        }
      }

      // Link attraction
      for (const link of graphData.links) {
        const source = simNodes.find((n) => n.id === link.source);
        const target = simNodes.find((n) => n.id === link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.005;
          source.vx += dx * force;
          source.vy += dy * force;
          target.vx -= dx * force;
          target.vy -= dy * force;
        }
      }

      // Position update with damping
      for (const node of simNodes) {
        node.vx *= 0.88;
        node.vy *= 0.88;
        node.x += node.vx;
        node.y += node.vy;
      }

      // Draw
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // Draw Links
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1.5;
      for (const link of graphData.links) {
        const source = simNodes.find((n) => n.id === link.source);
        const target = simNodes.find((n) => n.id === link.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      }

      // Draw Nodes
      for (const node of simNodes) {
        const isMatch =
          !searchTerm ||
          node.title.toLowerCase().includes(searchTerm.toLowerCase());

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        if (node.isCurrent) {
          ctx.fillStyle = '#6366f1';
          ctx.shadowColor = '#818cf8';
          ctx.shadowBlur = 12;
        } else if (isMatch) {
          ctx.fillStyle = node.linksCount > 0 ? '#38bdf8' : '#64748b';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#334155';
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '11px Vazirmatn, Inter, sans-serif';
        ctx.fillStyle = isMatch ? '#f1f5f9' : '#475569';
        ctx.textAlign = 'center';
        ctx.fillText(node.title, node.x, node.y + node.radius + 14);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(simulate);
    };

    simulate();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, graphData, zoom, searchTerm, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div className="w-full max-w-4xl h-[650px] rounded-3xl bg-neutral-950 border border-neutral-800 flex flex-col overflow-hidden shadow-2xl text-neutral-100">
        {/* Top Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-sm text-neutral-100">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>Interactive Knowledge Graph</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Obsidian Style
            </span>
          </div>

          {/* Search bar inside graph */}
          <div className="flex items-center gap-1.5 bg-neutral-900 rounded-xl px-3 py-1.5 border border-neutral-800 text-xs w-60">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter graph notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-neutral-900 rounded-xl p-1 border border-neutral-800">
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
                className="p-1 rounded text-neutral-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="p-1 rounded text-neutral-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1 rounded text-neutral-400 hover:text-white"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-neutral-950 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={860}
            height={520}
            className="w-full h-full block cursor-grab active:cursor-grabbing"
          />

          {/* Quick instructions pill */}
          <div className="absolute bottom-4 left-4 text-[11px] text-neutral-400 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-xl pointer-events-none flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            <span>Current Document</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block ml-2"></span>
            <span>Connected Wiki Notes</span>
            <span className="ml-2 font-mono text-[10px]">Use [[Title]] in markdown</span>
          </div>
        </div>

        {/* Bottom Document Selector Bar */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/50 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-neutral-500 shrink-0 font-medium text-[11px]">Jump to:</span>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => {
                onSelectDoc(doc.id);
                onClose();
              }}
              className={`px-3 py-1 rounded-xl shrink-0 transition-colors border ${
                doc.id === currentDocId
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 font-semibold'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
              }`}
            >
              {doc.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
