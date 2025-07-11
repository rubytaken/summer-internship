'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  Square,
  Circle,
  Diamond,
  Triangle,
  Minus,
  Type,
  Search
} from 'lucide-react';
import * as fabric from 'fabric';
import { useDiagramStore } from '@/stores/diagramStore';
import { aiService, DiagramGenerationRequest } from '@/lib/ai/gemini';

interface SidebarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

export default function Sidebar({ selectedTool, onToolSelect }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'flowchart'])
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { canvas } = useDiagramStore();

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, shapeType: string) => {
    e.dataTransfer.setData('text/plain', shapeType);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a small preview image
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="60" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="40" fill="#3B82F6" stroke="#1F2937" stroke-width="2" rx="5"/>
        <text x="30" y="25" font-family="Arial" font-size="10" fill="white" text-anchor="middle">${shapeType}</text>
      </svg>
    `);
    e.dataTransfer.setDragImage(img, 30, 20);
  };



  const handleQuickGenerate = async () => {
    if (!aiPrompt.trim() || !canvas) return;

    setIsGenerating(true);
    try {
      const request: DiagramGenerationRequest = {
        prompt: aiPrompt,
        diagramType: 'flowchart',
        style: 'detailed',
        maxNodes: 8,
      };

      console.log('🤖 Generating diagram with text-aware sizing...');
      const response = await aiService.generateDiagram(request);
      
              // Use the new Canvas rendering function with text-aware sizing
        const windowWithCanvas = window as typeof window & { canvasRenderAIDiagram?: (nodes: any, connections: any) => void };
        if (windowWithCanvas.canvasRenderAIDiagram) {
          windowWithCanvas.canvasRenderAIDiagram(response.nodes, response.connections);
          console.log('✨ AI diagram rendered with optimal text sizing!');
        } else {
        // Fallback to manual rendering if Canvas function not available
        console.log('⚠️ Using fallback rendering method');
        
        // Clear canvas except grid
        const objects = canvas.getObjects();
        const gridObjects = objects.filter(obj => (obj as fabric.FabricObject & { excludeFromExport?: boolean }).excludeFromExport || obj.stroke === '#F1F5F9' || obj.stroke === '#CBD5E1');
        canvas.clear();
        gridObjects.forEach(obj => canvas.add(obj));

        // Create node map for connections
        const nodeMap = new Map<string, fabric.FabricObject>();
        
        // Render nodes with enhanced sizing (fallback)
        response.nodes.forEach(node => {
          let shape: fabric.FabricObject;
          
          const commonProps = {
            shadow: new fabric.Shadow({
              color: 'rgba(0, 0, 0, 0.15)',
              blur: 6,
              offsetX: 3,
              offsetY: 3,
            }),
            strokeWidth: 2,
          };
          
          if (node.type === 'circle') {
            shape = new fabric.Circle({
              left: node.x,
              top: node.y,
              radius: Math.min(node.width, node.height) / 2,
              fill: node.fill,
              stroke: node.stroke,
              ...commonProps,
            });
          } else if (node.type === 'diamond') {
            const points = [
              { x: node.width / 2, y: 0 },
              { x: node.width, y: node.height / 2 },
              { x: node.width / 2, y: node.height },
              { x: 0, y: node.height / 2 },
            ];
            shape = new fabric.Polygon(points, {
              left: node.x,
              top: node.y,
              fill: node.fill,
              stroke: node.stroke,
              ...commonProps,
            });
          } else if (node.type === 'ellipse') {
            shape = new fabric.Ellipse({
              left: node.x,
              top: node.y,
              rx: node.width / 2,
              ry: node.height / 2,
              fill: node.fill,
              stroke: node.stroke,
              ...commonProps,
            });
          } else {
            // Rectangle and others with rounded corners
            shape = new fabric.Rect({
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
              fill: node.fill,
              stroke: node.stroke,
              rx: 10,
              ry: 10,
              ...commonProps,
            });
          }

          shape.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
          });

          canvas.add(shape);
          nodeMap.set(node.id, shape);

          // Add text with improved styling
          if (node.text) {
            const text = new fabric.Text(node.text, {
              left: node.x + node.width / 2,
              top: node.y + node.height / 2,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: '600',
              fill: node.fill && (node.fill === '#ffffff' || node.fill === '#FFFFFF') ? '#1F2937' : '#ffffff',
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false,
            });
            canvas.add(text);
          }
        });

        // Add connections with improved arrows
        response.connections.forEach(connection => {
          const fromNode = nodeMap.get(connection.from);
          const toNode = nodeMap.get(connection.to);
          
          if (fromNode && toNode) {
            const fromBounds = fromNode.getBoundingRect();
            const toBounds = toNode.getBoundingRect();
            
            const fromX = fromBounds.left + fromBounds.width / 2;
            const fromY = fromBounds.top + fromBounds.height / 2;
            const toX = toBounds.left + toBounds.width / 2;
            const toY = toBounds.top + toBounds.height / 2;

            // Enhanced arrow with better styling
            const line = new fabric.Line([fromX, fromY, toX, toY], {
              stroke: '#4B5563',
              strokeWidth: 3,
              selectable: false,
              evented: false,
            });

            const angle = Math.atan2(toY - fromY, toX - fromX);
            const arrowLength = 12;
            const arrowAngle = Math.PI / 6;

            const arrowHead = new fabric.Polygon([
              { x: 0, y: 0 },
              { x: -arrowLength * Math.cos(arrowAngle), y: arrowLength * Math.sin(arrowAngle) },
              { x: -arrowLength * Math.cos(arrowAngle), y: -arrowLength * Math.sin(arrowAngle) },
            ], {
              left: toX,
              top: toY,
              fill: '#4B5563',
              angle: (angle * 180) / Math.PI,
              selectable: false,
              evented: false,
              originX: 'center',
              originY: 'center',
            });

            canvas.add(line);
            canvas.add(arrowHead);

            // Add connection label if provided
            if (connection.label) {
              const midX = (fromX + toX) / 2;
              const midY = (fromY + toY) / 2;
              
              const labelBg = new fabric.Rect({
                left: midX - connection.label.length * 3,
                top: midY - 8,
                width: connection.label.length * 6,
                height: 16,
                fill: '#ffffff',
                stroke: '#E5E7EB',
                strokeWidth: 1,
                rx: 4,
                ry: 4,
                selectable: false,
                evented: false,
              });

              const labelText = new fabric.Text(connection.label, {
                left: midX,
                top: midY,
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                fill: '#374151',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
              });

              canvas.add(labelBg);
              canvas.add(labelText);
            }
          }
        });

        canvas.renderAll();
      }
      
      setAiPrompt('');
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('Failed to generate diagram. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shapeCategories = [
    {
      id: 'basic',
      title: 'Basic Shapes',
      shapes: [
        { id: 'rectangle', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: Circle, label: 'Circle' },
        { id: 'triangle', icon: Triangle, label: 'Triangle' },
        { id: 'line', icon: Minus, label: 'Line' },
        { id: 'arrow', icon: Square, label: 'Arrow' },
        { id: 'star', icon: Square, label: 'Star' },
        { id: 'hexagon', icon: Square, label: 'Hexagon' },
      ]
    },
    {
      id: 'flowchart',
      title: 'Flowchart',
      shapes: [
        { id: 'process', icon: Square, label: 'Process' },
        { id: 'decision', icon: Diamond, label: 'Decision' },
        { id: 'terminator', icon: Circle, label: 'Start/End' },
        { id: 'data', icon: Square, label: 'Data' },
        { id: 'document', icon: Square, label: 'Document' },
      ]
    },
    {
      id: 'ui',
      title: 'UI Elements',
      shapes: [
        { id: 'button', icon: Square, label: 'Button' },
        { id: 'card', icon: Square, label: 'Card' },
        { id: 'modal', icon: Square, label: 'Modal' },
      ]
    },
    {
      id: 'text',
      title: 'Text & Labels',
      shapes: [
        { id: 'text', icon: Type, label: 'Text Box' },
      ]
    }
  ];

  // Filter shapes based on search term
  const filteredCategories = shapeCategories.map(category => ({
    ...category,
    shapes: category.shapes.filter(shape => 
      shape.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shape.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.shapes.length > 0);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search shapes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-xs text-gray-500">
            {filteredCategories.reduce((total, cat) => total + cat.shapes.length, 0)} shapes found
          </div>
        )}
      </div>

      {/* Shape Categories */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.id} className="border-b border-gray-100">
              <button
                onClick={() => toggleSection(category.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-700 text-sm">{category.title}</span>
                {expandedSections.has(category.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              {expandedSections.has(category.id) && (
                <div className="pb-2">
                  {category.shapes.map((shape) => (
                    <div
                      key={shape.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, shape.id)}
                      onClick={() => onToolSelect(shape.id)}
                      className={`w-full flex items-center space-x-3 px-5 py-2 hover:bg-gray-50 transition-colors cursor-pointer select-none ${
                        selectedTool === shape.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                      }`}
                      title={`Drag to canvas or click to select tool`}
                    >
                      <shape.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{shape.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No shapes found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* AI Panel */}
      <div className="p-3 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800 text-sm">Generate with AI</h3>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your diagram... (e.g., 'Create a login process flowchart')"
            className="w-full h-16 p-2 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isGenerating}
          />
          <button 
            onClick={handleQuickGenerate}
            disabled={!aiPrompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Diagram'}
          </button>
          
          {isGenerating && (
            <div className="flex items-center justify-center py-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-xs text-gray-600">Creating...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 