import * as fabric from 'fabric';
import { calculateShapeSize, getTextPosition } from '@/lib/canvas/textUtils';
import { DiagramNode, DiagramConnection, ShapeWithSize, STORAGE_KEY } from './types';

// Helper function to save canvas state to localStorage
export const saveCanvasState = (canvas: fabric.Canvas) => {
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
          objData.originX = textObj.originX;
          objData.originY = textObj.originY;
          
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
    const savedTextCount = userObjects.filter(obj => obj.type === 'text' || obj.type === 'textbox' || obj.type === 'i-text').length;
    console.log(`💾 Saved ${userObjects.length} objects to localStorage, including ${savedTextCount} text objects`);
  } catch (error) {
    console.error('Failed to save canvas state:', error);
  }
};

// Helper function to load canvas state from localStorage
export const loadCanvasState = async (canvas: fabric.Canvas) => {
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
      const textObjectsInStorage = parsedState.objects.filter((obj: any) => {
        const type = obj.type?.toLowerCase();
        return type === 'text' || type === 'textbox' || type === 'i-text';
      });
      
      // PHASE 1: Restore shapes first (non-text objects)
      const shapeObjects = parsedState.objects.filter((obj: any) => {
        const type = obj.type?.toLowerCase();
        return !(type === 'text' || type === 'textbox' || type === 'i-text');
      });
      
      // PHASE 2: Restore text objects second (so they appear on top)
      const textObjects = parsedState.objects.filter((obj: any) => {
        const type = obj.type?.toLowerCase();
        return type === 'text' || type === 'textbox' || type === 'i-text';
      });
      
      const allObjectsToRestore = [...shapeObjects, ...textObjects];
      console.log(`📋 Restoration order: ${shapeObjects.length} shapes first, then ${textObjects.length} texts on top`);
      
      // Process all objects asynchronously and wait for completion
      const restorationPromises = allObjectsToRestore.map(async (objData: any) => {
        try {
          // Handle text objects specially (case-insensitive)
          const objectType = objData.type?.toLowerCase();
          if (objectType === 'text' || objectType === 'textbox' || objectType === 'i-text') {
            let textObj: fabric.Text | fabric.Textbox;
            
            if (objectType === 'textbox') {
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
                originX: objData.originX || 'left',
                originY: objData.originY || 'top',
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
            // Force text to front (above shapes)
            canvas.bringObjectToFront(textObj);
            return textObj;
          } else {
            // For non-text objects, use the standard enliven method
            const objects = await fabric.util.enlivenObjects([objData]);
            if (objects[0]) {
              canvas.add(objects[0]);
              return objects[0];
            }
            return null;
          }
        } catch (error) {
          console.error('Failed to restore object:', error, objData);
          return null;
        }
      });
      
      // Wait for all objects to be restored
      await Promise.all(restorationPromises);
      
      // CRITICAL: Force all text objects to front (above all shapes)
      const allCanvasObjects = canvas.getObjects();
      const restoredTextObjects = allCanvasObjects.filter(obj => {
        const type = obj.type?.toLowerCase();
        return type === 'text' || type === 'textbox' || type === 'i-text';
      });
      
      // Move all text objects to the very front
      restoredTextObjects.forEach(textObj => {
        canvas.bringObjectToFront(textObj);
      });
      
      console.log(`🔝 Moved ${restoredTextObjects.length} text objects to front`);
      
      // Render after all objects are loaded and texts are on top
      canvas.renderAll();
      const textObjectsRestored = textObjects.length;
      console.log(`✅ Canvas state loaded from localStorage with all objects restored (${parsedState.objects.length} total, ${textObjectsRestored} text objects on top)`);
    }
  } catch (error) {
    console.error('Failed to load canvas state:', error);
  }
};

// Helper function to create shapes with text-aware sizing
export const createShapeWithText = (
  shapeType: 'rectangle' | 'circle' | 'diamond' | 'ellipse' | 'triangle',
  text: string,
  x: number,
  y: number,
  fill: string = '#3B82F6',
  stroke: string = '#1D4ED8'
): ShapeWithSize => {
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
export const createModernArrow = (x1: number, y1: number, x2: number, y2: number, label: string) => {
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
export const createModernFabricNode = (node: DiagramNode): fabric.FabricObject => {
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
export const createModernConnection = (connection: DiagramConnection, nodeMap: Map<string, fabric.FabricObject>) => {
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
export const renderAIDiagram = (nodes: DiagramNode[], connections: DiagramConnection[], canvas: fabric.Canvas) => {
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

  // CRITICAL: Move all text objects to front after everything is added
  const allObjects = canvas.getObjects();
  const textObjects = allObjects.filter(obj => {
    const type = obj.type?.toLowerCase();
    return type === 'text' || type === 'textbox' || type === 'i-text';
  });
  
  textObjects.forEach(textObj => {
    canvas.bringObjectToFront(textObj);
  });
  
  console.log(`🔝 AI Render: Moved ${textObjects.length} text objects to front`);

  canvas.renderAll();
  console.log('✨ Modern diagram rendered successfully with optimal text sizing!');
}; 