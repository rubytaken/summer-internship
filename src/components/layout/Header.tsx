'use client';

import { useState } from 'react';
import { 
  User, 
  Settings, 
  FileText, 
  Share2, 
  Download,
  Menu
} from 'lucide-react';
import { useDiagramStore } from '@/stores/diagramStore';

export default function Header() {
  const { projectName, setProjectName, setSelectedTool } = useDiagramStore();

  const handleAIGenerate = () => {
    setSelectedTool('ai-suggest');
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section - Logo and Project Name */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">AC</span>
          </div>
          <span className="font-semibold text-gray-800">AI Charts</span>
        </div>
        
        <div className="h-4 w-px bg-gray-300" />
        
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-gray-700 font-medium focus:outline-none focus:bg-gray-50 px-2 py-1 rounded"
          placeholder="Project name"
        />
      </div>

      {/* Right Section - Actions and User */}
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Share">
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
        
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Export">
          <Download className="w-4 h-4 text-gray-600" />
        </button>
        
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Settings">
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
        
        <div className="h-4 w-px bg-gray-300" />
        
        <button className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>
    </header>
  );
} 