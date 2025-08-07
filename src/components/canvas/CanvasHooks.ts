import { useEffect } from 'react';
import * as fabric from 'fabric';
import { useDiagramStore } from '@/stores/diagramStore';
import { 
  saveCanvasState, 
  loadCanvasState, 
  renderAIDiagram as renderAIDiagramHelper 
} from './CanvasHelpers';
import { 
  createDropHandler,
  handleDragOver,
  handleDragLeave,
  createMouseDownHandler,
  createPanningHandlers
} from './CanvasEventHandlers';
import { DiagramNode, DiagramConnection } from './types';

// Hook for canvas initialization with grid and persistence
export const useCanvasInitialization = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>,
  setCanvas: (canvas: fabric.Canvas) => void,
  onShapeSelect: (shape: any) => void
) => {
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('🚀 Initializing Infinite Canvas...');

    try {
      // Create much larger canvas for infinite feel
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1600,  // Much larger canvas
        height: 1200,
        backgroundColor: '#ffffff',
        selection: true,
      });

      // Store canvas reference
      fabricCanvasRef.current = canvas;
      setCanvas(canvas);

      // Add modern subtle grid background for larger area
      console.log('🎯 Adding infinite grid...');
      const gridSize = 20;
      
      // Create subtle grid lines across larger canvas
      for (let i = 0; i <= canvas.width!; i += gridSize) {
        const verticalLine = new fabric.Line([i, 0, i, canvas.height!], {
          stroke: i % (gridSize * 5) === 0 ? '#CBD5E1' : '#F1F5F9',
          strokeWidth: i % (gridSize * 5) === 0 ? 1 : 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        } as any);
        canvas.add(verticalLine);
      }

      for (let i = 0; i <= canvas.height!; i += gridSize) {
        const horizontalLine = new fabric.Line([0, i, canvas.width!, i], {
          stroke: i % (gridSize * 5) === 0 ? '#CBD5E1' : '#F1F5F9',
          strokeWidth: i % (gridSize * 5) === 0 ? 1 : 0.5,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        } as any);
        canvas.add(horizontalLine);
      }

      // Load saved state from localStorage (if exists)
      setTimeout(async () => {
        await loadCanvasState(canvas);
      }, 100);

      // Set up auto-save on canvas changes with debouncing
      let saveTimeout: NodeJS.Timeout;
      const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveCanvasState(canvas), 500);
      };

      canvas.on('object:added', debouncedSave);
      canvas.on('object:removed', debouncedSave);
      canvas.on('object:modified', debouncedSave);

      // Make canvas render context available to AI
      (window as any).canvasRenderAIDiagram = (nodes: DiagramNode[], connections: DiagramConnection[]) => {
        renderAIDiagramHelper(nodes, connections, canvas);
      };

      // Selection events
      canvas.on('selection:created', (e: any) => {
        console.log('Shape selected:', e.selected?.[0]);
        onShapeSelect(e.selected?.[0] || null);
      });

      canvas.on('selection:cleared', () => {
        console.log('Selection cleared');
        onShapeSelect(null);
      });

      // Panning functionality
      const { onMouseDown, onMouseMove, onMouseUp } = createPanningHandlers(canvas);
      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);

      // Modern drag and drop functionality
      const handleDrop = createDropHandler(canvas);
      canvas.upperCanvasEl.addEventListener('drop', handleDrop);
      canvas.upperCanvasEl.addEventListener('dragover', handleDragOver);
      canvas.upperCanvasEl.addEventListener('dragleave', handleDragLeave);

      // Force render
      canvas.renderAll();
      console.log('✅ Infinite Canvas initialized successfully');

      // Cleanup
      return () => {
        console.log('🧹 Cleaning up infinite canvas');
        try {
          canvas.upperCanvasEl.removeEventListener('drop', handleDrop);
          canvas.upperCanvasEl.removeEventListener('dragover', handleDragOver);
          canvas.upperCanvasEl.removeEventListener('dragleave', handleDragLeave);
          canvas.dispose();
        } catch (error) {
          console.error('Canvas cleanup error:', error);
        }
      };
    } catch (error) {
      console.error('Canvas initialization error:', error);
    }
  }, [setCanvas, onShapeSelect]);
};

// Hook for handling cursor changes based on selected tool
export const useToolCursor = (
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>,
  selectedTool: string
) => {
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Set cursor for hand tool
    if (selectedTool === 'hand') {
      canvas.defaultCursor = 'grab';
      canvas.hoverCursor = 'grab';
    } else {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    }
  }, [selectedTool]);
};

// Hook for handling mouse clicks for tool creation
export const useToolCreation = (
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>,
  selectedTool: string
) => {
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleMouseDown = createMouseDownHandler(canvas, selectedTool);
    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [selectedTool]);
}; 