import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
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

  // Stable node generation
  const initialNodes: Node[] = useMemo(() => {
    return repositories.map((repo, idx) => {
      // Deterministic layout coordinates
      const x = repo.constellation?.x ?? 150 + (idx % 3) * 220;
      const y = repo.constellation?.y ?? 100 + Math.floor(idx / 3) * 160;

      return {
        id: repo.id,
        type: "repositoryNode",
        position: { x, y },
        data: {
          repository: repo,
          onSelect: onSelectRepo,
          isSelected: selectedRepo?.id === repo.id,
        },
      };
    });
  }, [repositories, selectedRepo, onSelectRepo]);

  // Edges connecting repositories with defined shared relationships
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < repositories.length; i++) {
      for (let j = i + 1; j < repositories.length; j++) {
        const repoA = repositories[i];
        const repoB = repositories[j];

        // Connect if they share primary language or AI/frontend domain
        const sharedLanguages = repoA.languages.filter((l) => repoB.languages.includes(l));
        const sharedGroup = repoA.constellation?.group === repoB.constellation?.group;

        if (sharedLanguages.length > 0 || sharedGroup) {
          const isRelatedToSelected =
            selectedRepo && (selectedRepo.id === repoA.id || selectedRepo.id === repoB.id);

          edges.push({
            id: `edge-${repoA.id}-${repoB.id}`,
            source: repoA.id,
            target: repoB.id,
            animated: isRelatedToSelected || false,
            style: {
              stroke: isRelatedToSelected
                ? "rgba(254, 133, 0, 0.85)"
                : "rgba(255, 196, 140, 0.14)",
              strokeWidth: isRelatedToSelected ? 1.6 : 0.8,
              strokeDasharray: sharedGroup ? "4 4" : undefined,
            },
          });
        }
      }
    }
    return edges;
  }, [repositories, selectedRepo]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  // Seamless sky: no container box — the constellation floats on the page's living background.
  return (
    <div className="relative w-full h-[640px]">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-white/75">
        <Network className="w-3.5 h-3.5 text-tangerine-300" />
        <span className="font-medium">Repository Constellation</span>
        <span className="text-white/35">•</span>
        <span>{repositories.length} stars</span>
      </div>

      <div className="absolute top-2 right-2 z-10">
        <button onClick={handleResetView} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-white/80 hover:text-white" title="Reset zoom & pan">
          <RotateCcw className="w-3.5 h-3.5 text-tangerine-300" /> Reset view
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.4}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Controls showInteractive={false} className="!bottom-2 !right-2 !m-0" />
      </ReactFlow>

      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] text-white/60 max-w-md">
        <Info className="w-3.5 h-3.5 text-tangerine-300 shrink-0" />
        <span>Bigger, brighter stars match you better. Hover to preview · click to open.</span>
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
