'use client';

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useDiagramStore } from '@/stores/diagramStore';
import { calculateShapeSize, getTextPosition } from '@/lib/canvas/textUtils';
import { PromptInput } from '@/components/ui/ai-chat-input';
import { clientAIService } from '@/lib/ai/client';
import { DiagramGenerationRequest } from '@/lib/ai/gemini';

// Import AI types
interface DiagramNode {
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

interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type: 'arrow' | 'line';
}

interface CanvasProps {
  selectedTool: string;
  onShapeSelect: (shape: any) => void;
}

// Storage key for localStorage
const STORAGE_KEY = 'ai-charts-canvas-state';

export default function Canvas({ selectedTool, onShapeSelect }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const { setCanvas } = useDiagramStore();
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper function to save canvas state to localStorage
  const saveCanvasState = (canvas: fabric.Canvas) => {
    try {
      if (!canvas) return;
      
      // Get all objects and filter out grid lines
      const allObjects = canvas.getObjects();
      const userObjects = allObjects.filter(obj => {
        // Exclude grid lines and other system objects
        return !(obj as any).excludeFromExport && 
               obj.stroke !== '#F1F5F9' && 
               obj.stroke !== '#CBD5E1';
      });
      
      // Save only user objects with all necessary properties
      const saveData = {
        objects: userObjects.map(obj => {
          // Get base object data
          const objData = obj.toObject(['id', 'selectable', 'evented', 'hasControls', 'hasBorders']);
          
          // Add text-specific properties if it's a text object
          if (obj.type === 'text' || obj.type === 'textbox' || obj.type === 'i-text') {
            const textObj = obj as fabric.Text | fabric.Textbox;
            objData.text = textObj.text;
            objData.fontSize = textObj.fontSize;
            objData.fontFamily = textObj.fontFamily;
            objData.fontWeight = textObj.fontWeight;
            objData.textAlign = textObj.textAlign;
            objData.lineHeight = textObj.lineHeight;
            objData.charSpacing = textObj.charSpacing;
            
            // For Textbox specifically
            if (obj.type === 'textbox') {
              const textboxObj = obj as fabric.Textbox;
              objData.width = textboxObj.width;
              objData.splitByGrapheme = textboxObj.splitByGrapheme;
            }
          }
          
          return objData;
        })
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save canvas state:', error);
    }
  };

  // Helper function to load canvas state from localStorage
  const loadCanvasState = (canvas: fabric.Canvas) => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState || !canvas) return;
      
      const parsedState = JSON.parse(savedState);
      
      // Clear only user objects (keep grid)
      const allObjects = canvas.getObjects();
      const userObjects = allObjects.filter(obj => {
        return !(obj as any).excludeFromExport && 
               obj.stroke !== '#F1F5F9' && 
               obj.stroke !== '#CBD5E1';
      });
      
      userObjects.forEach(obj => canvas.remove(obj));
      
      // Restore user objects
      if (parsedState.objects && Array.isArray(parsedState.objects)) {
        parsedState.objects.forEach(async (objData: any) => {
          try {
            // Handle text objects specially
            if (objData.type === 'text' || objData.type === 'textbox' || objData.type === 'i-text') {
              let textObj: fabric.Text | fabric.Textbox;
              
              if (objData.type === 'textbox') {
                textObj = new fabric.Textbox(objData.text || '', {
                  left: objData.left,
                  top: objData.top,
                  width: objData.width,
                  height: objData.height,
                  fontSize: objData.fontSize || 16,
                  fontFamily: objData.fontFamily || 'Inter, sans-serif',
                  fontWeight: objData.fontWeight || 'normal',
                  fill: objData.fill || '#000000',
                  textAlign: objData.textAlign || 'left',
                  angle: objData.angle || 0,
                  scaleX: objData.scaleX || 1,
                  scaleY: objData.scaleY || 1,
                  flipX: objData.flipX || false,
                  flipY: objData.flipY || false,
                  opacity: objData.opacity || 1,
                  selectable: objData.selectable !== false,
                  evented: objData.evented !== false,
                  visible: objData.visible !== false,
                  backgroundColor: objData.backgroundColor,
                  lineHeight: objData.lineHeight || 1.16,
                  charSpacing: objData.charSpacing || 0,
                  splitByGrapheme: objData.splitByGrapheme,
                });
              } else {
                textObj = new fabric.Text(objData.text || '', {
                  left: objData.left,
                  top: objData.top,
                  fontSize: objData.fontSize || 16,
                  fontFamily: objData.fontFamily || 'Inter, sans-serif',
                  fontWeight: objData.fontWeight || 'normal',
                  fill: objData.fill || '#000000',
                  textAlign: objData.textAlign || 'left',
                  angle: objData.angle || 0,
                  scaleX: objData.scaleX || 1,
                  scaleY: objData.scaleY || 1,
                  flipX: objData.flipX || false,
                  flipY: objData.flipY || false,
                  opacity: objData.opacity || 1,
                  selectable: objData.selectable !== false,
                  evented: objData.evented !== false,
                  visible: objData.visible !== false,
                  backgroundColor: objData.backgroundColor,
                  lineHeight: objData.lineHeight || 1.16,
                  charSpacing: objData.charSpacing || 0,
                  originX: objData.originX || 'left',
                  originY: objData.originY || 'top',
                });
              }
              
              canvas.add(textObj);
            } else {
              // For non-text objects, use the standard enliven method
              fabric.util.enlivenObjects([objData]).then((objects: any[]) => {
                if (objects[0]) {
                  canvas.add(objects[0]);
                }
              }).catch((error) => {
                console.error('Failed to restore object:', error, objData);
              });
            }
          } catch (error) {
            console.error('Failed to restore object:', error, objData);
          }
        });
        
        // Render after all objects are loaded
        setTimeout(() => {
          canvas.renderAll();
          console.log('✅ Canvas state loaded from localStorage');
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load canvas state:', error);
    }
  };

  // Helper function to create shapes with text-aware sizing
  const createShapeWithText = (
    shapeType: 'rectangle' | 'circle' | 'diamond' | 'ellipse' | 'triangle',
    text: string,
    x: number,
    y: number,
    fill: string = '#3B82F6',
    stroke: string = '#1D4ED8'
  ) => {
    // Calculate optimal size for the text
    const optimalSize = calculateShapeSize(text, shapeType, 14, 'Inter, sans-serif', '500');
    
    let shape: fabric.FabricObject;
    
    const commonProps = {
      left: x,
      top: y,
      fill,
      stroke,
      strokeWidth: 2,
      shadow: new fabric.Shadow({
        color: 'rgba(0, 0, 0, 0.1)',
        blur: 4,
        offsetX: 2,
        offsetY: 2,
      }),
    };

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          ...commonProps,
          width: optimalSize.width,
          height: optimalSize.height,
          rx: 8,
          ry: 8,
        });
        break;

      case 'circle':
        const radius = Math.max(optimalSize.width, optimalSize.height) / 2;
        shape = new fabric.Circle({
          ...commonProps,
          radius,
        });
        break;

      case 'diamond':
        const diamondPoints = [
          { x: optimalSize.width / 2, y: 0 },
          { x: optimalSize.width, y: optimalSize.height / 2 },
          { x: optimalSize.width / 2, y: optimalSize.height },
          { x: 0, y: optimalSize.height / 2 },
        ];
        shape = new fabric.Polygon(diamondPoints, commonProps);
        break;

      case 'ellipse':
        shape = new fabric.Ellipse({
          ...commonProps,
          rx: optimalSize.width / 2,
          ry: optimalSize.height / 2,
        });
        break;

      case 'triangle':
        const trianglePoints = [
          { x: optimalSize.width / 2, y: 0 },
          { x: optimalSize.width, y: optimalSize.height },
          { x: 0, y: optimalSize.height },
        ];
        shape = new fabric.Polygon(trianglePoints, commonProps);
        break;

      default:
        shape = new fabric.Rect({
          ...commonProps,
          width: optimalSize.width,
          height: optimalSize.height,
          rx: 8,
          ry: 8,
        });
    }

    return { shape, optimalSize };
  };

  // Helper function for modern arrows
  const createModernArrow = (x1: number, y1: number, x2: number, y2: number, label: string) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 12;
    const arrowAngle = Math.PI / 6;

    // Main line
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: '#374151',
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });

    // Arrow head
    const arrowHead = new fabric.Polygon([
      { x: 0, y: 0 },
      { x: -arrowLength * Math.cos(arrowAngle), y: arrowLength * Math.sin(arrowAngle) },
      { x: -arrowLength * Math.cos(arrowAngle), y: -arrowLength * Math.sin(arrowAngle) },
    ], {
      left: x2,
      top: y2,
      fill: '#374151',
      angle: (angle * 180) / Math.PI,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
    });

    const elements: fabric.FabricObject[] = [line, arrowHead];

    // Add label if provided
    if (label) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      const labelBg = new fabric.Rect({
        left: midX - 15,
        top: midY - 8,
        width: 30,
        height: 16,
        fill: '#ffffff',
        stroke: '#E5E7EB',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        selectable: false,
        evented: false,
      });

      const labelText = new fabric.Text(label, {
        left: midX,
        top: midY,
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
        fill: '#374151',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      elements.push(labelBg as fabric.FabricObject, labelText as fabric.FabricObject);
    }

    return elements;
  };

  // Modern Fabric node creator for AI diagrams with text-aware sizing
  const createModernFabricNode = (node: DiagramNode): fabric.FabricObject => {
    let shape: fabric.FabricObject;

    // Use text-aware sizing if text exists, otherwise use provided dimensions
    const shouldAutoSize = node.text && node.text.length > 0;
    let finalWidth = node.width;
    let finalHeight = node.height;

    if (shouldAutoSize) {
      const optimalSize = calculateShapeSize(node.text, node.type, 13, 'Inter, sans-serif', '500');
      finalWidth = optimalSize.width;
      finalHeight = optimalSize.height;
      console.log(`📏 Auto-sized ${node.type} for "${node.text}": ${finalWidth}x${finalHeight}`);
    }

    switch (node.type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: node.x,
          top: node.y,
          width: finalWidth,
          height: finalHeight,
          fill: node.fill || '#3B82F6',
          stroke: node.stroke || '#1D4ED8',
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'circle':
        const radius = Math.max(finalWidth, finalHeight) / 2;
        shape = new fabric.Circle({
          left: node.x,
          top: node.y,
          radius,
          fill: node.fill || '#10B981',
          stroke: node.stroke || '#047857',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'diamond':
        const diamondPoints = [
          { x: finalWidth / 2, y: 0 },
          { x: finalWidth, y: finalHeight / 2 },
          { x: finalWidth / 2, y: finalHeight },
          { x: 0, y: finalHeight / 2 },
        ];
        shape = new fabric.Polygon(diamondPoints, {
          left: node.x,
          top: node.y,
          fill: node.fill || '#F59E0B',
          stroke: node.stroke || '#D97706',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'ellipse':
        shape = new fabric.Ellipse({
          left: node.x,
          top: node.y,
          rx: finalWidth / 2,
          ry: finalHeight / 2,
          fill: node.fill || '#10B981',
          stroke: node.stroke || '#047857',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      case 'triangle':
        const trianglePoints = [
          { x: finalWidth / 2, y: 0 },
          { x: finalWidth, y: finalHeight },
          { x: 0, y: finalHeight },
        ];
        shape = new fabric.Polygon(trianglePoints, {
          left: node.x,
          top: node.y,
          fill: node.fill || '#EF4444',
          stroke: node.stroke || '#DC2626',
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
        break;

      default:
        shape = new fabric.Rect({
          left: node.x,
          top: node.y,
          width: finalWidth,
          height: finalHeight,
          fill: node.fill || '#3B82F6',
          stroke: node.stroke || '#1D4ED8',
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
          }),
        });
    }

    shape.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
    });

    return shape;
  };

  // Smart connection creator with edge-to-edge arrows
  const createModernConnection = (connection: DiagramConnection, nodeMap: Map<string, fabric.FabricObject>) => {
    const fromNode = nodeMap.get(connection.from);
    const toNode = nodeMap.get(connection.to);
    
    if (!fromNode || !toNode) return null;

    // Calculate edge-to-edge connection points
    const fromBounds = fromNode.getBoundingRect();
    const toBounds = toNode.getBoundingRect();

    const fromCenterX = fromBounds.left + fromBounds.width / 2;
    const fromCenterY = fromBounds.top + fromBounds.height / 2;
    const toCenterX = toBounds.left + toBounds.width / 2;
    const toCenterY = toBounds.top + toBounds.height / 2;

    // Determine connection points on edges
    let fromX = fromCenterX;
    let fromY = fromCenterY;
    let toX = toCenterX;
    let toY = toCenterY;

    // Calculate angle and adjust connection points to edges
    const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX);

    // From node edge point
    if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
      // Horizontal connection
      fromX = fromCenterX + (Math.cos(angle) > 0 ? fromBounds.width / 2 : -fromBounds.width / 2);
      fromY = fromCenterY;
    } else {
      // Vertical connection
      fromX = fromCenterX;
      fromY = fromCenterY + (Math.sin(angle) > 0 ? fromBounds.height / 2 : -fromBounds.height / 2);
    }

    // To node edge point (opposite direction)
    const toAngle = angle + Math.PI;
    if (Math.abs(Math.cos(toAngle)) > Math.abs(Math.sin(toAngle))) {
      toX = toCenterX + (Math.cos(toAngle) > 0 ? toBounds.width / 2 : -toBounds.width / 2);
      toY = toCenterY;
    } else {
      toX = toCenterX;
      toY = toCenterY + (Math.sin(toAngle) > 0 ? toBounds.height / 2 : -toBounds.height / 2);
    }

    return createModernArrow(fromX, fromY, toX, toY, connection.label || '');
  };

  // Render AI diagram with enhanced text sizing
  const renderAIDiagram = (nodes: DiagramNode[], connections: DiagramConnection[]) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('🎨 Rendering modern AI diagram with text-aware sizing...');

    // Clear previous content except grid
    const objects = canvas.getObjects();
    const gridObjects = objects.filter(obj => (obj as any).excludeFromExport || obj.stroke === '#F1F5F9' || obj.stroke === '#CBD5E1');
    canvas.clear();
    gridObjects.forEach(obj => canvas.add(obj));

    // Create node map
    const nodeMap = new Map<string, fabric.FabricObject>();
    
    // Add nodes with text-aware sizing
    for (const node of nodes) {
      const fabricShape = createModernFabricNode(node);
      canvas.add(fabricShape);
      nodeMap.set(node.id, fabricShape);

      // Add text label with smart positioning
      if (node.text) {
        const shapeBounds = fabricShape.getBoundingRect();
        const textPos = getTextPosition(
          shapeBounds.left,
          shapeBounds.top,
          shapeBounds.width,
          shapeBounds.height,
          node.type
        );

        const text = new fabric.Text(node.text, {
          left: textPos.x,
          top: textPos.y,
          fontSize: 13,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: '500',
          fill: node.fill && (node.fill === '#ffffff' || node.fill === '#FFFFFF') ? '#1F2937' : '#ffffff',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });
        canvas.add(text);
      }
    }

    // Add modern connections
    for (const connection of connections) {
      const connParts = createModernConnection(connection, nodeMap);
      if (connParts) {
        connParts.forEach(part => canvas.add(part));
      }
    }

    canvas.renderAll();
    console.log('✨ Modern diagram rendered successfully with optimal text sizing!');
  };

  // Handle AI diagram generation
  const handleAIGenerate = async (prompt: string) => {
    const canvas = fabricCanvasRef.current;
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

  // Initialize canvas with larger size - only on mount
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
      setTimeout(() => {
        loadCanvasState(canvas);
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
      (window as any).canvasRenderAIDiagram = renderAIDiagram;

      // Selection events
      canvas.on('selection:created', (e: any) => {
        console.log('Shape selected:', e.selected?.[0]);
        onShapeSelect(e.selected?.[0] || null);
      });

      canvas.on('selection:cleared', () => {
        console.log('Selection cleared');
        onShapeSelect(null);
      });

      // Hand tool panning functionality with proper event handling
      let isPanning = false;
      let lastPosX = 0;
      let lastPosY = 0;

      canvas.on('mouse:down', (opt: any) => {
        const evt = opt.e;
        const tool = useDiagramStore.getState().selectedTool;
        if (tool === 'hand' || (evt.altKey && tool === 'select')) {
          isPanning = true;
          canvas.selection = false;
          lastPosX = evt.clientX || evt.touches?.[0]?.clientX || 0;
          lastPosY = evt.clientY || evt.touches?.[0]?.clientY || 0;
          canvas.defaultCursor = 'grabbing';
        }
      });

      canvas.on('mouse:move', (opt: any) => {
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
      });

      canvas.on('mouse:up', () => {
        if (isPanning) {
          canvas.setViewportTransform(canvas.viewportTransform!);
          isPanning = false;
          canvas.selection = true;
          const tool = useDiagramStore.getState().selectedTool;
          canvas.defaultCursor = tool === 'hand' ? 'grab' : 'default';
        }
      });

      // Handle drag and drop with text-aware sizing
      const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        const shapeType = e.dataTransfer?.getData('text/plain');
        console.log('🎯 Drop:', shapeType);

        if (!shapeType) return;

        const rect = canvas.upperCanvasEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
          console.log('✅ Adding shape to infinite canvas:', shapeType);
          canvas.add(shape);
          canvas.setActiveObject(shape);
          canvas.renderAll();

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

      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
      };

      // Add event listeners
      canvas.upperCanvasEl.addEventListener('drop', handleDrop);
      canvas.upperCanvasEl.addEventListener('dragover', handleDragOver);

      // Force render
      canvas.renderAll();
      console.log('✅ Infinite Canvas initialized successfully');

      // Cleanup
      return () => {
        console.log('🧹 Cleaning up infinite canvas');
        try {
          canvas.upperCanvasEl.removeEventListener('drop', handleDrop);
          canvas.upperCanvasEl.removeEventListener('dragover', handleDragOver);
          canvas.dispose();
        } catch (error) {
          console.error('Canvas cleanup error:', error);
        }
      };
    } catch (error) {
      console.error('Canvas initialization error:', error);
    }
  }, [setCanvas, onShapeSelect]); // Remove selectedTool from dependencies

  // Separate effect for handling cursor based on selected tool
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

  // Handle mouse clicks for tool creation with text-aware sizing
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
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
        canvas.setActiveObject(shape);
        canvas.renderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [selectedTool]);

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Canvas Area - Full Screen */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="border border-gray-200 bg-white shadow-xl rounded-lg overflow-hidden">
          <canvas 
            ref={canvasRef}
            style={{ display: 'block' }}
          />
        </div>
      </div>
      
      {/* Floating AI Input - Positioned over Canvas */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 p-4">
          <PromptInput
            placeholder="Describe your diagram... (e.g., 'Create a login process flowchart')"
            onSubmit={handleAIGenerate}
            disabled={isGenerating}
            className="border-purple-200 focus-within:border-purple-400 focus-within:ring-purple-400 shadow-none"
          />
          {isGenerating && (
            <div className="flex items-center justify-center mt-3 pt-2 border-t border-gray-100">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-sm text-gray-600 font-medium">Creating diagram...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 