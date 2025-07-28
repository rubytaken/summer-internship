'use client';

import { useEffect, useState } from 'react';
import { 
  MousePointer, 
  Square, 
  Circle, 
  Type, 
  Minus,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Download,
  Copy,
  Scissors,
  FileImage,
  FileText,
  Maximize,
  Move,
  Trash2
} from 'lucide-react';
import * as fabric from 'fabric';
import { useDiagramStore } from '@/stores/diagramStore';
import { CanvasHistoryManager, CanvasExporter, CanvasClipboard, CanvasZoom } from '@/lib/canvas/canvasUtils';

interface ToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

export default function Toolbar({ selectedTool, onToolSelect }: ToolbarProps) {
  const { canvas, zoomLevel, setZoomLevel, canUndo, canRedo, setHistoryState } = useDiagramStore();
  const [historyManager, setHistoryManager] = useState<CanvasHistoryManager | null>(null);
  const [exporter, setExporter] = useState<CanvasExporter | null>(null);
  const [clipboard, setClipboard] = useState<CanvasClipboard | null>(null);
  const [zoomManager, setZoomManager] = useState<CanvasZoom | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (canvas) {
      const history = new CanvasHistoryManager(canvas);
      const exporter = new CanvasExporter(canvas);
      const clip = new CanvasClipboard(canvas);
      const zoom = new CanvasZoom(canvas);
      
      setHistoryManager(history);
      setExporter(exporter);
      setClipboard(clip);
      setZoomManager(zoom);
      
      // Update zoom level periodically
      const updateZoom = () => {
        setZoomLevel(zoom.getZoomLevel());
        setHistoryState(history.canUndo(), history.canRedo());
      };
      
      const interval = setInterval(updateZoom, 1000);
      return () => clearInterval(interval);
    }
  }, [canvas, setZoomLevel, setHistoryState]);

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'hand', icon: Move, label: 'Hand Tool' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'line', icon: Minus, label: 'Line' },
  ];

  const handleUndo = () => {
    if (historyManager) {
      historyManager.undo();
      setHistoryState(historyManager.canUndo(), historyManager.canRedo());
    }
  };

  const handleRedo = () => {
    if (historyManager) {
      historyManager.redo();
      setHistoryState(historyManager.canUndo(), historyManager.canRedo());
    }
  };

  const handleZoomIn = () => {
    if (zoomManager) {
      zoomManager.zoomIn();
      setZoomLevel(zoomManager.getZoomLevel());
    }
  };

  const handleZoomOut = () => {
    if (zoomManager) {
      zoomManager.zoomOut();
      setZoomLevel(zoomManager.getZoomLevel());
    }
  };

  const handleZoomFit = () => {
    if (zoomManager) {
      zoomManager.zoomToFit();
      setZoomLevel(zoomManager.getZoomLevel());
    }
  };

  const handleExport = (format: string) => {
    if (!exporter) return;
    
    switch (format) {
      case 'png':
        exporter.exportToPNG();
        break;
      case 'jpg':
        exporter.exportToJPEG();
        break;
      case 'svg':
        exporter.exportToSVG();
        break;
      case 'pdf':
        exporter.exportToPDF();
        break;
      case 'json':
        exporter.exportToJSON();
        break;
    }
    setShowExportMenu(false);
  };

  const handleCopy = () => {
    if (clipboard) {
      clipboard.copy();
    }
  };

  const handleCut = () => {
    if (clipboard) {
      clipboard.cut();
    }
  };

  const handlePaste = async () => {
    if (clipboard) {
      await clipboard.paste();
    }
  };

  const handleDuplicate = async () => {
    if (clipboard) {
      await clipboard.duplicate();
      setHistoryState(historyManager?.canUndo() || false, historyManager?.canRedo() || false);
    }
  };

  const handleDelete = () => {
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 0) {
        // Remove all selected objects
        activeObjects.forEach(obj => {
          canvas.remove(obj);
        });
        
        // Clear selection
        canvas.discardActiveObject();
        canvas.renderAll();
        
        // Update history state
        setHistoryState(historyManager?.canUndo() || false, historyManager?.canRedo() || false);
        
        console.log(`🗑️ Deleted ${activeObjects.length} object(s)`);
      }
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Skip if no canvas available
      if (!canvas) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            e.stopPropagation();
            handleRedo();
            break;
          case 'c':
            e.preventDefault();
            e.stopPropagation();
            handleCopy();
            break;
          case 'x':
            e.preventDefault();
            e.stopPropagation();
            handleCut();
            break;
          case 'v':
            e.preventDefault();
            e.stopPropagation();
            handlePaste();
            break;
          case 'd':
            e.preventDefault();
            e.stopPropagation();
            handleDuplicate();
            break;
          case 'a':
            e.preventDefault();
            e.stopPropagation();
            // Select all objects
            const allObjects = canvas.getObjects().filter(obj => {
              const fabricObj = obj as any;
              return !fabricObj.excludeFromExport && 
                     obj.stroke !== '#F1F5F9' && 
                     obj.stroke !== '#CBD5E1';
            });
            if (allObjects.length > 0) {
              if (allObjects.length === 1) {
                canvas.setActiveObject(allObjects[0]);
              } else {
                const selection = new fabric.ActiveSelection(allObjects as any[], {
                  canvas: canvas,
                } as any);
                canvas.setActiveObject(selection as any);
              }
              canvas.renderAll();
            }
            break;
          case '+':
          case '=':
            e.preventDefault();
            e.stopPropagation();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            e.stopPropagation();
            handleZoomOut();
            break;
          case '0':
            e.preventDefault();
            e.stopPropagation();
            if (zoomManager) {
              zoomManager.resetZoom();
              setZoomLevel(100);
            }
            break;
        }
      } else {
        // Handle non-Ctrl keys
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
            break;
          case 'Escape':
            e.preventDefault();
            e.stopPropagation();
            // Clear selection
            canvas.discardActiveObject();
            canvas.renderAll();
            break;
        }
      }
    };

    // Add event listener to document with capture to ensure we catch it first
    document.addEventListener('keydown', handleKeyboard, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyboard, true);
    };
  }, [canvas, historyManager, clipboard, zoomManager, setZoomLevel]);

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 space-x-1">
      {/* Main Tools */}
      <div className="flex items-center space-x-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`p-2 rounded-md transition-colors ${
              selectedTool === tool.id
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* History Tools */}
      <div className="flex items-center space-x-1">
        <button 
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        
        <button 
          onClick={handleRedo}
          disabled={!canRedo}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* Clipboard Tools */}
      <div className="flex items-center space-x-1">
        <button 
          onClick={handleCopy}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Copy (Ctrl+C)"
        >
          <Copy className="w-4 h-4" />
        </button>
        
        <button 
          onClick={handleCut}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Cut (Ctrl+X)"
        >
          <Scissors className="w-4 h-4" />
        </button>
        
        <button 
          onClick={handlePaste}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Paste (Ctrl+V)"
        >
          <FileText className="w-4 h-4" />
        </button>
        
        <button 
          onClick={handleDuplicate}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Duplicate (Ctrl+D)"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* Delete Tool */}
      <div className="flex items-center space-x-1">
        <button 
          onClick={handleDelete}
          className="p-2 hover:bg-red-100 rounded-md transition-colors text-red-600 hover:text-red-700"
          title="Delete Selected (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* Zoom Tools */}
      <div className="flex items-center space-x-1">
        <button 
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        <span className="text-sm text-gray-600 px-2 min-w-[50px] text-center">{zoomLevel}%</span>
        
        <button 
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Zoom In (Ctrl++)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <button 
          onClick={handleZoomFit}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Zoom to Fit"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* Export Tools */}
      <div className="relative">
        <button 
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          title="Export Diagram"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Export</span>
        </button>
        
        {showExportMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
            <button 
              onClick={() => handleExport('png')}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
            >
              <FileImage className="w-4 h-4" />
              <span>PNG Image</span>
            </button>
            <button 
              onClick={() => handleExport('jpg')}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
            >
              <FileImage className="w-4 h-4" />
              <span>JPEG Image</span>
            </button>
            <button 
              onClick={() => handleExport('svg')}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
            >
              <FileImage className="w-4 h-4" />
              <span>SVG Vector</span>
            </button>
            <button 
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Document</span>
            </button>
            <button 
              onClick={() => handleExport('json')}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>JSON Data</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-6 w-px bg-gray-300 mx-2" />

      
      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
} 