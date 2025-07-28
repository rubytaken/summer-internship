'use client';

import { useState, useEffect } from 'react';
import { 
  Palette, 
  Type, 
  Layout,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import * as fabric from 'fabric';

interface PropertiesPanelProps {
  selectedShape: fabric.FabricObject | null;
}

export default function PropertiesPanel({ selectedShape }: PropertiesPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['style', 'text', 'position'])
  );

  // Shape properties state
  const [properties, setProperties] = useState({
    fill: '#3B82F6',
    stroke: '#1D4ED8',
    strokeWidth: 2,
    left: 0,
    top: 0,
    width: 100,
    height: 60,
    text: '',
    fontSize: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
    opacity: 1,
  });

  // Update properties when selectedShape changes
  useEffect(() => {
    if (selectedShape) {
      const updatePropertiesFromShape = () => {
        const newProperties = {
          fill: selectedShape.fill?.toString() || '#3B82F6',
          stroke: selectedShape.stroke?.toString() || '#1D4ED8',
          strokeWidth: selectedShape.strokeWidth || 2,
          left: Math.round(selectedShape.left || 0),
          top: Math.round(selectedShape.top || 0),
          width: selectedShape.type === 'circle' 
            ? Math.round((selectedShape as any).radius * 2 || 60)
            : Math.round(selectedShape.width || 100),
          height: selectedShape.type === 'circle'
            ? Math.round((selectedShape as any).radius * 2 || 60)
            : Math.round(selectedShape.height || 60),
          text: (selectedShape as any).text || '',
          fontSize: (selectedShape as any).fontSize || 16,
          fontFamily: (selectedShape as any).fontFamily || 'Inter',
          textAlign: (selectedShape as any).textAlign || 'center',
          opacity: selectedShape.opacity || 1,
        };
        setProperties(newProperties);
      };

      // Initial update
      updatePropertiesFromShape();

      // Listen for shape changes
      const handleShapeModified = () => {
        updatePropertiesFromShape();
      };

      selectedShape.on('modified', handleShapeModified);
      selectedShape.on('moved', handleShapeModified);
      selectedShape.on('scaled', handleShapeModified);

      return () => {
        selectedShape.off('modified', handleShapeModified);
        selectedShape.off('moved', handleShapeModified);
        selectedShape.off('scaled', handleShapeModified);
      };
    }
  }, [selectedShape]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const updateProperty = (key: string, value: any) => {
    if (!selectedShape) return;

    // Update local state
    setProperties(prev => ({ ...prev, [key]: value }));

    // Special handling for different shape types
    if (selectedShape.type === 'circle') {
      if (key === 'width' || key === 'height') {
        // For circles, update radius when width/height changes
        const radius = Math.max(1, value / 2);
        selectedShape.set({ radius });
      } else {
        selectedShape.set({ [key]: value });
      }
    } else {
      // For other shapes, update normally
      selectedShape.set({ [key]: value });
    }

    selectedShape.canvas?.renderAll();
  };

  const getShapeTypeName = () => {
    if (!selectedShape) return 'No selection';
    
    const type = selectedShape.type;
    switch (type) {
      case 'rect': return 'Rectangle';
      case 'circle': return 'Circle';
      case 'polygon': return 'Polygon';
      case 'textbox':
      case 'text': return 'Text';
      case 'line': return 'Line';
      default: return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Shape';
    }
  };

  if (!selectedShape) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 text-sm">
          <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>Select a shape to view properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-800">Properties</h3>
        <p className="text-xs text-gray-500 mt-1">{getShapeTypeName()} selected</p>
      </div>

      {/* Properties Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Style Section */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('style')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700 text-sm">Style</span>
            </div>
            {expandedSections.has('style') ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.has('style') && (
            <div className="px-4 pb-4 space-y-3">
              {/* Fill Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fill Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={properties.fill}
                    onChange={(e) => updateProperty('fill', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={properties.fill}
                    onChange={(e) => updateProperty('fill', e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Stroke Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={properties.stroke}
                    onChange={(e) => updateProperty('stroke', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={properties.stroke}
                    onChange={(e) => updateProperty('stroke', e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Stroke Width */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Stroke Width: {properties.strokeWidth}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={properties.strokeWidth}
                  onChange={(e) => updateProperty('strokeWidth', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Opacity: {Math.round(properties.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={properties.opacity}
                  onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Section - Show only for text objects */}
        {(selectedShape.type === 'textbox' || selectedShape.type === 'text') && (
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection('text')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 text-sm">Text</span>
              </div>
              {expandedSections.has('text') ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.has('text') && (
              <div className="px-4 pb-4 space-y-3">
                {/* Text Content */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Text Content</label>
                  <textarea
                    value={properties.text}
                    onChange={(e) => updateProperty('text', e.target.value)}
                    placeholder="Enter text..."
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                {/* Font Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Font Size: {properties.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    value={properties.fontSize}
                    onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                
                {/* Font Family */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                  <select 
                    value={properties.fontFamily}
                    onChange={(e) => updateProperty('fontFamily', e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                
                {/* Text Align */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Text Align</label>
                  <div className="flex space-x-1">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        onClick={() => updateProperty('textAlign', align)}
                        className={`flex-1 text-xs border border-gray-200 rounded px-2 py-1 transition-colors ${
                          properties.textAlign === align 
                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Position & Size Section */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('position')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Layout className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700 text-sm">Position & Size</span>
            </div>
            {expandedSections.has('position') ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {expandedSections.has('position') && (
            <div className="px-4 pb-4 space-y-3">
              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">X Position</label>
                  <input
                    type="number"
                    value={properties.left}
                    onChange={(e) => updateProperty('left', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y Position</label>
                  <input
                    type="number"
                    value={properties.top}
                    onChange={(e) => updateProperty('top', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Size - Show only for shapes that have width/height */}
              {selectedShape.type !== 'line' && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedShape.type === 'circle' ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Radius</label>
                        <input
                          type="number"
                          value={properties.width / 2}
                          onChange={(e) => {
                            const radius = parseFloat(e.target.value) || 0;
                            updateProperty('width', radius * 2);
                          }}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Diameter</label>
                        <input
                          type="number"
                          value={properties.width}
                          onChange={(e) => updateProperty('width', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                        <input
                          type="number"
                          value={properties.width}
                          onChange={(e) => updateProperty('width', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                        <input
                          type="number"
                          value={properties.height}
                          onChange={(e) => updateProperty('height', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-600 mb-2">Quick Actions</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      selectedShape.bringToFront();
                      selectedShape.canvas?.renderAll();
                    }}
                    className="text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors"
                  >
                    Bring to Front
                  </button>
                  <button
                    onClick={() => {
                      selectedShape.sendToBack();
                      selectedShape.canvas?.renderAll();
                    }}
                    className="text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors"
                  >
                    Send to Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 