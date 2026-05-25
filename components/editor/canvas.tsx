"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel, SHAPE_DRAG_TYPE, type ShapePayload } from "@/components/editor/shape-panel";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import type { CanvasNode } from "@/types/canvas";

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

let nodeCounter = 0;

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const reactFlow = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(SHAPE_DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(SHAPE_DRAG_TYPE);
      if (!raw) return;

      const payload = JSON.parse(raw) as ShapePayload;
      const position = reactFlow.screenToFlowPosition({
        x: e.clientX - payload.width / 2,
        y: e.clientY - payload.height / 2,
      });

      const id = `${payload.shape}-${Date.now()}-${++nodeCounter}`;
      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR.fill,
          shape: payload.shape,
        },
        style: { width: payload.width, height: payload.height },
      };

      reactFlow.addNodes(newNode);
    },
    [reactFlow]
  );

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
      >
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}
