"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";

export function CanvasNodeRenderer({ data }: NodeProps<CanvasNode>) {
  const fill = data.color ?? DEFAULT_NODE_COLOR.fill;
  const textColor = DEFAULT_NODE_COLOR.text;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-border text-xs"
      style={{ background: fill, color: textColor }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <span className="px-2 text-center">{data.label}</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
