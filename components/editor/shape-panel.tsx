"use client";

import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { NodeShape } from "@/types/canvas";
import type { LucideIcon } from "lucide-react";

interface ShapeDef {
  shape: NodeShape;
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
}

const SHAPES: ShapeDef[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal, width: 160, height: 80 },
  { shape: "diamond",   label: "Diamond",   icon: Diamond,             width: 140, height: 120 },
  { shape: "circle",    label: "Circle",    icon: Circle,              width: 80,  height: 80 },
  { shape: "pill",      label: "Pill",      icon: Pill,                width: 160, height: 60 },
  { shape: "cylinder",  label: "Cylinder",  icon: Cylinder,            width: 90,  height: 110 },
  { shape: "hexagon",   label: "Hexagon",   icon: Hexagon,             width: 100, height: 100 },
];

export interface ShapePayload {
  shape: NodeShape;
  width: number;
  height: number;
}

export const SHAPE_DRAG_TYPE = "application/x-canvas-shape";

export function ShapePanel() {
  function onDragStart(e: React.DragEvent, def: ShapeDef) {
    const payload: ShapePayload = { shape: def.shape, width: def.width, height: def.height };
    e.dataTransfer.setData(SHAPE_DRAG_TYPE, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 shadow-lg">
      {SHAPES.map((def) => {
        const Icon = def.icon;
        return (
          <button
            key={def.shape}
            draggable
            onDragStart={(e) => onDragStart(e, def)}
            title={def.label}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
