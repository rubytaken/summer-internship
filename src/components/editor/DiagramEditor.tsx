'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Canvas from '@/components/editor/Canvas';
import PropertiesPanel from '@/components/layout/PropertiesPanel';
import Toolbar from '@/components/layout/Toolbar';
import { useDiagramStore } from '@/stores/diagramStore';

export default function DiagramEditor() {
  const { selectedTool, setSelectedTool, selectedShape, setSelectedShape } = useDiagramStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Header */}
      <Header />
      
      {/* Toolbar */}
      <Toolbar 
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Shape Library */}
        <div className="flex-shrink-0">
          <Sidebar 
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-50">
          <Canvas 
            selectedTool={selectedTool}
            onShapeSelect={setSelectedShape}
          />
        </div>
        
        {/* Properties Panel */}
        <div className="flex-shrink-0">
          <PropertiesPanel 
            selectedShape={selectedShape}
          />
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 bg-gray-100 border-t border-gray-200 flex items-center px-4 text-xs text-gray-600">
        <span>Zoom: {useDiagramStore.getState().zoomLevel}%</span>
        <span className="mx-4">|</span>
        <span>Grid: {useDiagramStore.getState().showGrid ? 'On' : 'Off'}</span>
        <span className="mx-4">|</span>
        <span>Ready</span>
        <span className="mx-4">|</span>
        <span>Use Ctrl+Z/Y for undo/redo, Ctrl+C/V for copy/paste</span>
      </div>
    </div>
  );
} 