import { create } from 'zustand';
import * as fabric from 'fabric';

interface DiagramState {
  // Canvas
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas | null) => void;
  
  // Tools
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  
  // Shapes
  selectedShape: fabric.FabricObject | null;
  setSelectedShape: (shape: fabric.FabricObject | null) => void;
  
  // Project
  projectName: string;
  setProjectName: (name: string) => void;
  
  // Zoom
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  
  // Grid
  showGrid: boolean;
  toggleGrid: () => void;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  setHistoryState: (canUndo: boolean, canRedo: boolean) => void;
}

export const useDiagramStore = create<DiagramState>()((set, get) => ({
  // Canvas
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),
  
  // Tools
  selectedTool: 'select',
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  
  // Shapes
  selectedShape: null,
  setSelectedShape: (shape) => set({ selectedShape: shape }),
  
  // Project
  projectName: 'Untitled Diagram',
  setProjectName: (name) => set({ projectName: name }),
  
  // Zoom
  zoomLevel: 1,
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  
  // Grid
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  
  // History
  canUndo: false,
  canRedo: false,
  setHistoryState: (canUndo, canRedo) => set({ canUndo, canRedo }),
})); 