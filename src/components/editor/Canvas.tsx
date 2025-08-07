'use client';

import { useRef } from 'react';
import * as fabric from 'fabric';
import { useDiagramStore } from '@/stores/diagramStore';
import { CanvasProps } from '@/components/canvas/types';
import { createHandleAIGenerate } from '@/components/canvas/CanvasEventHandlers';
import { renderAIDiagram } from '@/components/canvas/CanvasHelpers';
import { 
  useCanvasInitialization, 
  useToolCursor, 
  useToolCreation 
} from '@/components/canvas/CanvasHooks';
import FloatingAIInput from '@/components/canvas/FloatingAIInput';

export default function Canvas({ selectedTool, onShapeSelect }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const { setCanvas } = useDiagramStore();

  // Custom hooks for canvas functionality
  useCanvasInitialization(canvasRef, fabricCanvasRef, setCanvas, onShapeSelect);
  useToolCursor(fabricCanvasRef, selectedTool);
  useToolCreation(fabricCanvasRef, selectedTool);

  // AI generation handler
  const handleAIGenerate = createHandleAIGenerate(
    fabricCanvasRef.current,
    () => {}, // setIsGenerating is now handled inside FloatingAIInput
    (nodes, connections) => renderAIDiagram(nodes, connections, fabricCanvasRef.current!)
  );

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Canvas Area - Full Screen */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="canvas-container border border-gray-200 bg-white shadow-xl rounded-lg overflow-hidden">
          <canvas 
            ref={canvasRef}
            style={{ display: 'block' }}
          />
        </div>
      </div>
      
      {/* Floating AI Input - Positioned over Canvas */}
      <FloatingAIInput onGenerate={handleAIGenerate} />
    </div>
  );
} 