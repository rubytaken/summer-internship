import * as fabric from 'fabric';
import { useDiagramStore } from '@/stores/diagramStore';
import { createShapeWithText } from './CanvasHelpers';
import { clientAIService } from '@/lib/ai/client';
import { DiagramGenerationRequest } from '@/lib/ai/gemini';
import { DiagramNode, DiagramConnection } from './types';

// Handle AI diagram generation
export const createHandleAIGenerate = (
  canvas: fabric.Canvas | null,
  setIsGenerating: (generating: boolean) => void,
  renderAIDiagram: (nodes: DiagramNode[], connections: DiagramConnection[]) => void
) => {
  return async (prompt: string) => {
    if (!prompt.trim() || !canvas) return;

    setIsGenerating(true);
    try {
      const request: DiagramGenerationRequest = {
        prompt: prompt,
        diagramType: 'flowchart',
        style: 'detailed',
        maxNodes: 8,
      };

      console.log('🤖 Generating diagram with text-aware sizing...');
      const response = await clientAIService.generateDiagram(request);
      
      // Use the renderAIDiagram function
      renderAIDiagram(response.nodes, response.connections);
      console.log('✨ AI diagram rendered with optimal text sizing!');
      
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('Failed to generate diagram. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
};

// Modern enhanced drag and drop with smooth animations
export const createDropHandler = (canvas: fabric.Canvas) => {
  return (e: DragEvent) => {
    e.preventDefault();
    const shapeType = e.dataTransfer?.getData('text/plain');
    console.log('🎯 Modern Drop:', shapeType);

    if (!shapeType) return;

    // Create drop animation feedback
    const rect = canvas.upperCanvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add smooth drop feedback animation
    const dropIndicator = document.createElement('div');
    dropIndicator.style.cssText = `
      position: absolute;
      left: ${x - 15}px;
      top: ${y - 15}px;
      width: 30px;
      height: 30px;
      border: 3px solid #10B981;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      animation: modernDropPulse 0.8s ease-out forwards;
    `;
    
    canvas.upperCanvasEl.parentElement?.appendChild(dropIndicator);
    
    setTimeout(() => {
      if (dropIndicator.parentNode) {
        dropIndicator.parentNode.removeChild(dropIndicator);
      }
    }, 800);

    // Clear any hover effects
    canvas.upperCanvasEl.style.filter = '';

    let shape: fabric.FabricObject | null = null;

    // Create shapes with comprehensive support for all types
    switch (shapeType) {
      case 'rectangle':
        const { shape: rectShape } = createShapeWithText('rectangle', 'Rectangle', x - 50, y - 30);
        shape = rectShape;
        break;

      case 'circle':
        const { shape: circleShape } = createShapeWithText('circle', 'Circle', x - 30, y - 30);
        shape = circleShape;
        break;

      case 'triangle':
        const { shape: triangleShape } = createShapeWithText('triangle', 'Triangle', x - 40, y - 35);
        shape = triangleShape;
        break;

      case 'line':
        shape = new fabric.Line([x, y, x + 100, y], {
          stroke: '#374151',
          strokeWidth: 3,
          selectable: true,
          evented: true,
        });
        break;

      // Flowchart shapes
      case 'process':
        const { shape: processShape } = createShapeWithText('rectangle', 'Process', x - 60, y - 30, '#3B82F6', '#1D4ED8');
        shape = processShape;
        break;

      case 'decision':
        const { shape: decisionShape } = createShapeWithText('diamond', 'Decision?', x - 50, y - 40, '#F59E0B', '#D97706');
        shape = decisionShape;
        break;

      case 'terminator':
        const { shape: terminatorShape } = createShapeWithText('circle', 'Start/End', x - 40, y - 30, '#10B981', '#047857');
        shape = terminatorShape;
        break;

      case 'data':
        // Parallelogram for data
        const dataPoints = [
          { x: 20, y: 0 },
          { x: 120, y: 0 },
          { x: 100, y: 60 },
          { x: 0, y: 60 },
        ];
        shape = new fabric.Polygon(dataPoints, {
          left: x - 60,
          top: y - 30,
          fill: '#8B5CF6',
          stroke: '#7C3AED',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'document':
        // Document shape with wavy bottom
        const docPoints = [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 50 },
          { x: 85, y: 60 },
          { x: 70, y: 50 },
          { x: 55, y: 60 },
          { x: 40, y: 50 },
          { x: 25, y: 60 },
          { x: 10, y: 50 },
          { x: 0, y: 60 },
        ];
        shape = new fabric.Polygon(docPoints, {
          left: x - 50,
          top: y - 30,
          fill: '#06B6D4',
          stroke: '#0891B2',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'text':
        shape = new fabric.Textbox('Double click to edit', {
          left: x - 25,
          top: y - 10,
          width: 150,
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          fill: '#1F2937',
        });
        break;

      // UI Elements
      case 'button':
        shape = new fabric.Rect({
          left: x - 50,
          top: y - 20,
          width: 100,
          height: 40,
          fill: '#3B82F6',
          stroke: '#1D4ED8',
          strokeWidth: 2,
          rx: 20,
          ry: 20,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'card':
        shape = new fabric.Rect({
          left: x - 70,
          top: y - 50,
          width: 140,
          height: 100,
          fill: '#F8FAFC',
          stroke: '#E2E8F0',
          strokeWidth: 2,
          rx: 12,
          ry: 12,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 8,
            offsetX: 2,
            offsetY: 4,
          }),
        });
        break;

      case 'modal':
        shape = new fabric.Rect({
          left: x - 80,
          top: y - 60,
          width: 160,
          height: 120,
          fill: '#FFFFFF',
          stroke: '#D1D5DB',
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.25)',
            blur: 20,
            offsetX: 0,
            offsetY: 8,
          }),
        });
        break;

      // New shapes
      case 'arrow':
        const arrowPoints = [
          { x: 0, y: 20 },
          { x: 60, y: 20 },
          { x: 60, y: 10 },
          { x: 80, y: 30 },
          { x: 60, y: 50 },
          { x: 60, y: 40 },
          { x: 0, y: 40 },
        ];
        shape = new fabric.Polygon(arrowPoints, {
          left: x - 40,
          top: y - 30,
          fill: '#10B981',
          stroke: '#047857',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'star':
        const starPoints = [
          { x: 50, y: 0 },
          { x: 61, y: 35 },
          { x: 98, y: 35 },
          { x: 68, y: 57 },
          { x: 79, y: 91 },
          { x: 50, y: 70 },
          { x: 21, y: 91 },
          { x: 32, y: 57 },
          { x: 2, y: 35 },
          { x: 39, y: 35 },
        ];
        shape = new fabric.Polygon(starPoints, {
          left: x - 50,
          top: y - 45,
          fill: '#F59E0B',
          stroke: '#D97706',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'hexagon':
        const hexPoints = [
          { x: 50, y: 0 },
          { x: 93, y: 25 },
          { x: 93, y: 75 },
          { x: 50, y: 100 },
          { x: 7, y: 75 },
          { x: 7, y: 25 },
        ];
        shape = new fabric.Polygon(hexPoints, {
          left: x - 50,
          top: y - 50,
          fill: '#8B5CF6',
          stroke: '#7C3AED',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;
    }

    if (shape) {
      console.log('✅ Adding shape with modern animation:', shapeType);
      
      // Add entrance animation
      const originalScale = shape.scaleX || 1;
      shape.set({
        scaleX: 0.1,
        scaleY: 0.1,
        opacity: 0.3
      });
      
      canvas.add(shape);
      
      // If it's a text object, bring it to front
      if (shape.type === 'text' || shape.type === 'textbox' || shape.type === 'i-text') {
        canvas.bringObjectToFront(shape);
        console.log(`🔝 DragDrop: Moved text object to front`);
      }
      
      canvas.setActiveObject(shape);
      
      // Smooth entrance animation
      shape.animate({
        scaleX: originalScale,
        scaleY: originalScale,
        opacity: 1
      }, {
        duration: 300,
        easing: fabric.util.ease.easeOutBounce,
        onChange: canvas.renderAll.bind(canvas),
        onComplete: () => {
          canvas.renderAll();
        }
      });

      // Add text for shapes that support it
      if (['data', 'document', 'button', 'card', 'modal', 'arrow', 'star', 'hexagon'].includes(shapeType)) {
        const bounds = shape.getBoundingRect();
        const text = new fabric.Text(shapeType.charAt(0).toUpperCase() + shapeType.slice(1), {
          left: bounds.left + bounds.width / 2,
          top: bounds.top + bounds.height / 2,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          fill: shapeType === 'card' ? '#1F2937' : '#ffffff',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });
        canvas.add(text);
      }
    }
  };
};

// Modern drag over with visual feedback
export const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'copy';
  
  // Add subtle hover effect to canvas
  const target = e.target as HTMLElement;
  const canvas = target.tagName === 'CANVAS' ? target : target.closest('canvas');
  if (canvas) {
    canvas.style.filter = 'brightness(1.05) saturate(1.1)';
    canvas.style.transition = 'filter 0.2s ease';
  }
};

// Handle drag leave to clean up visual effects
export const handleDragLeave = (e: DragEvent) => {
  const target = e.target as HTMLElement;
  const canvas = target.tagName === 'CANVAS' ? target : target.closest('canvas');
  if (canvas) {
    canvas.style.filter = '';
  }
};

// Handle mouse clicks for tool creation with text-aware sizing
export const createMouseDownHandler = (canvas: fabric.Canvas, selectedTool: string) => {
  return (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (selectedTool === 'select' || selectedTool === 'hand') return;

    const pointer = canvas.getPointer(opt.e);
    let shape: fabric.FabricObject | null = null;

    switch (selectedTool) {
      case 'rectangle':
        const { shape: rectShape } = createShapeWithText('rectangle', 'Rectangle', pointer.x, pointer.y);
        shape = rectShape;
        break;

      case 'circle':
        const { shape: circleShape } = createShapeWithText('circle', 'Circle', pointer.x, pointer.y);
        shape = circleShape;
        break;

      case 'triangle':
        const { shape: triangleShape } = createShapeWithText('triangle', 'Triangle', pointer.x, pointer.y);
        shape = triangleShape;
        break;

      case 'line':
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
          stroke: '#374151',
          strokeWidth: 3,
          selectable: true,
          evented: true,
        });
        break;

      case 'text':
        shape = new fabric.Textbox('Double click to edit', {
          left: pointer.x,
          top: pointer.y,
          width: 150,
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          fill: '#1F2937',
        });
        break;
    }

    if (shape) {
      console.log(`🎨 Creating ${selectedTool} at`, pointer, 'with text-aware sizing');
      canvas.add(shape);
      
      // If it's a text object, bring it to front
      if (shape.type === 'text' || shape.type === 'textbox' || shape.type === 'i-text') {
        canvas.bringObjectToFront(shape);
        console.log(`🔝 Manual: Moved text object to front`);
      }
      
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };
};

// Hand tool panning functionality
export const createPanningHandlers = (canvas: fabric.Canvas) => {
  let isPanning = false;
  let lastPosX = 0;
  let lastPosY = 0;

  const onMouseDown = (opt: any) => {
    const evt = opt.e;
    const tool = useDiagramStore.getState().selectedTool;
    if (tool === 'hand' || (evt.altKey && tool === 'select')) {
      isPanning = true;
      canvas.selection = false;
      lastPosX = evt.clientX || evt.touches?.[0]?.clientX || 0;
      lastPosY = evt.clientY || evt.touches?.[0]?.clientY || 0;
      canvas.defaultCursor = 'grabbing';
    }
  };

  const onMouseMove = (opt: any) => {
    if (isPanning) {
      const e = opt.e;
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] += clientX - lastPosX;
        vpt[5] += clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = clientX;
        lastPosY = clientY;
      }
    }
  };

  const onMouseUp = () => {
    if (isPanning) {
      canvas.setViewportTransform(canvas.viewportTransform!);
      isPanning = false;
      canvas.selection = true;
      const tool = useDiagramStore.getState().selectedTool;
      canvas.defaultCursor = tool === 'hand' ? 'grab' : 'default';
    }
  };

  return { onMouseDown, onMouseMove, onMouseUp };
}; 