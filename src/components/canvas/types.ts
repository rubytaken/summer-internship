// Canvas related types and interfaces
export interface DiagramNode {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'ellipse' | 'triangle';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type: 'arrow' | 'line';
}

export interface CanvasProps {
  selectedTool: string;
  onShapeSelect: (shape: any) => void;
}

export interface ShapeWithSize {
  shape: fabric.FabricObject;
  optimalSize: { width: number; height: number };
}

// Storage key for localStorage
export const STORAGE_KEY = 'ai-charts-canvas-state'; 