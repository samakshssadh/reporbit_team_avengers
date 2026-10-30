import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
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
import { RotateCcw, Info, Sparkles, Network } from "lucide-react";

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
                ? "rgba(99, 102, 241, 0.8)"
                : "rgba(148, 163, 184, 0.2)",
              strokeWidth: isRelatedToSelected ? 2 : 1,
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

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-[#07090e] shadow-2xl">
      {/* Background ambient cosmic glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[90px]" />
      </div>

      {/* Top Banner / Breadcrumb */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-space-900/80 backdrop-blur-md border border-slate-700/60 text-xs text-slate-300">
        <Network className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-medium">Repository Constellation</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400">{repositories.length} Active Nodes</span>
      </div>

      {/* Reset View Action */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleResetView}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-space-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white hover:bg-space-800 transition-all shadow-md"
          title="Reset Constellation Zoom & Pan"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reset View</span>
        </button>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.4}
        maxZoom={1.6}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="rgba(255, 255, 255, 0.08)"
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !right-4 !m-0"
        />
      </ReactFlow>

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-3 px-3.5 py-2 rounded-xl bg-space-900/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 max-w-sm">
        <Info className="w-4 h-4 text-indigo-400 shrink-0" />
        <p>
          <strong className="text-slate-200">Constellation Legend:</strong> Stars represent recommended open-source repositories; lines indicate shared languages or architecture domains.
        </p>
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
