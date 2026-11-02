import React, { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Repository } from "../../types";
import { RepositoryNode } from "./RepositoryNode";
import { RotateCcw, Info, Network } from "lucide-react";

interface ConstellationCanvasProps {
  repositories: Repository[];
  selectedRepo: Repository | null;
  onSelectRepo: (repo: Repository) => void;
}

const nodeTypes: any = {
  repositoryNode: RepositoryNode,
};

const ConstellationInner: React.FC<ConstellationCanvasProps> = ({
  repositories,
  selectedRepo,
  onSelectRepo,
}) => {
  const { fitView } = useReactFlow();

  // Orbital layout: best match at the centre, then rings of 6, 12, 18… stars.
  // Equal angular spacing on each ring + ring radius sized to the label width ⇒ no overlaps.
  const RING_GAP = 170;
  const ranked = useMemo(() => [...repositories].sort((a, b) => b.matchScore - a.matchScore), [repositories]);
  const ringOf = (idx: number) => { let ring = 0, cap = 1, start = 0; while (idx >= start + cap) { start += cap; ring += 1; cap = ring * 6; } return { ring, pos: idx - start, cap }; };
  const positions = useMemo(() => {
    const total = ranked.length;
    return ranked.map((_, idx) => {
      const { ring, pos, cap } = ringOf(idx);
      if (ring === 0) return { x: 0, y: 0, ring };
      // last ring may be partially filled: spread its stars evenly around the full circle
      let start = 1, c = 6, r = 1; while (r < ring) { start += c; r += 1; c = r * 6; }
      const inRing = Math.min(cap, total - start);
      const angle = (2 * Math.PI * pos) / inRing + (ring % 2 ? 0 : Math.PI / inRing) - Math.PI / 2;
      return { x: Math.round(Math.cos(angle) * ring * RING_GAP), y: Math.round(Math.sin(angle) * ring * RING_GAP), ring };
    });
  }, [ranked]);

  const initialNodes: Node[] = useMemo(() => {
    const stars: Node[] = ranked.map((repo, idx) => ({
      id: repo.id,
      type: "repositoryNode",
      position: positions[idx],
      data: { repository: repo, onSelect: onSelectRepo, isSelected: selectedRepo?.id === repo.id, rank: idx + 1 },
    }));
    return stars;
  }, [ranked, positions, selectedRepo, onSelectRepo]);

  // Sparse links: each star connects to the best-ranked star above it that shares its main language.
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    ranked.forEach((repo, idx) => {
      const parent = ranked.slice(0, idx).find((p) => p.primaryLanguage === repo.primaryLanguage);
      if (!parent) return;
      const hot = selectedRepo && (selectedRepo.id === repo.id || selectedRepo.id === parent.id);
      edges.push({ id: `e-${parent.id}-${repo.id}`, source: parent.id, target: repo.id, animated: !!hot, type: "straight", className: hot ? "edge-hot" : "edge-dim",
        style: { stroke: hot ? "rgba(254,133,0,0.85)" : "rgba(255,196,140,0.12)", strokeWidth: hot ? 1.5 : 0.8 } });
    });
    return edges;
  }, [ranked, selectedRepo]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  // Keep the sky in sync when results refresh (e.g. cache → live) or the selection changes.
  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);
  useEffect(() => { setEdges(initialEdges); }, [initialEdges, setEdges]);
  useEffect(() => { const t = setTimeout(() => fitView({ padding: 0.08, duration: 300 }), 50); return () => clearTimeout(t); }, [ranked.length, fitView]);

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.08, duration: 500 });
  }, [fitView]);

  // Seamless sky: no box, full screen width, drag to explore. Zoom is disabled on purpose so the
  // mouse wheel / trackpad scrolls the page normally instead of zooming the canvas.
  return (
    <div className="relative h-[78vh] min-h-[560px]" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
      <div className="pointer-events-none absolute inset-x-0 top-2 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-white/75">
            <Network className="w-3.5 h-3.5 text-tangerine-300" />
            <span className="font-medium">Repository Constellation</span>
            <span className="text-white/35">•</span>
            <span>{repositories.length} stars</span>
          </div>
          <button onClick={handleResetView} className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-white/80 hover:text-white" title="Re-centre the constellation">
            <RotateCcw className="w-3.5 h-3.5 text-tangerine-300" /> Re-centre
          </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        nodeOrigin={[0.5, 0.5]}
        minZoom={0.5}
        maxZoom={1.4}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        preventScrolling={false}
        panOnDrag
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, node) => (node.data as any)?.repository && onSelectRepo((node.data as any).repository)}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent", cursor: "grab" }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] text-white/60">
            <Info className="w-3.5 h-3.5 text-tangerine-300 shrink-0" />
            <span>Best matches sit at the centre · drag to explore · hover a star to preview · click to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ConstellationInner {...props} />
    </ReactFlowProvider>
  );
};
