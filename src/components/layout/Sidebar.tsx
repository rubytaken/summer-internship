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
import { useDiagramStore } from '@/stores/diagramStore';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

interface SidebarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

export default function Sidebar({ selectedTool, onToolSelect }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'flowchart'])
  );
  const [searchTerm, setSearchTerm] = useState('');
  
  const { canvas } = useDiagramStore();

  // Modern drag and drop handlers
  const { handleDragStart, handleDragEnd } = useDragAndDrop({
    onDragStart: (shapeType) => {
      console.log('🎯 Started dragging shape:', shapeType);
    },
    onDragEnd: () => {
      console.log('🏁 Finished dragging shape');
    },
  });

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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
                      onDragEnd={handleDragEnd}
                      onClick={() => onToolSelect(shape.id)}
                      className={`shape-item w-full flex items-center space-x-3 px-5 py-2 hover:bg-gray-50 transition-all duration-200 cursor-pointer select-none ${
                        selectedTool === shape.id ? 'bg-blue-50 text-blue-600 scale-105' : 'text-gray-600'
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


    </div>
  );
} 