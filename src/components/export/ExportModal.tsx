'use client';

import { useState } from 'react';
import { X, Download, FileImage, FileText, Loader2 } from 'lucide-react';
import { useDiagramStore } from '@/stores/diagramStore';
import { CanvasExporter } from '@/lib/canvas/canvasUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { canvas } = useDiagramStore();
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('png');

  const exportFormats = [
    {
      id: 'png',
      name: 'PNG Image',
      description: 'High quality raster image',
      icon: FileImage,
      extension: '.png'
    },
    {
      id: 'jpg',
      name: 'JPEG Image', 
      description: 'Compressed raster image',
      icon: FileImage,
      extension: '.jpg'
    },
    {
      id: 'svg',
      name: 'SVG Vector',
      description: 'Scalable vector graphics',
      icon: FileImage,
      extension: '.svg'
    },
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Portable document format',
      icon: FileText,
      extension: '.pdf'
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Editable diagram data',
      icon: FileText,
      extension: '.json'
    }
  ];

  const handleExport = async () => {
    if (!canvas) {
      alert('No canvas available for export');
      return;
    }

    setExporting(true);
    try {
      const exporter = new CanvasExporter(canvas);
      
      switch (selectedFormat) {
        case 'png':
          await exporter.exportToPNG();
          break;
        case 'jpg':
          await exporter.exportToJPEG();
          break;
        case 'svg':
          await exporter.exportToSVG();
          break;
        case 'pdf':
          await exporter.exportToPDF();
          break;
        case 'json':
          await exporter.exportToJSON();
          break;
        default:
          throw new Error('Unknown export format');
      }
      
      // Close modal after successful export
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[60] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] border border-white/20 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100/50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Download className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Export Diagram</h2>
              <p className="text-xs text-gray-500">Choose your preferred format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-all duration-200 hover:rotate-90"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Select Format</h3>
            <div className="grid gap-2">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  disabled={exporting}
                  className={`group w-full p-3 border rounded-lg text-left transition-all duration-200 disabled:opacity-50 ${
                    selectedFormat === format.id
                      ? 'bg-green-50 border-green-200 shadow-sm'
                      : 'border-gray-200 hover:border-green-200 hover:bg-green-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-md transition-colors ${
                      selectedFormat === format.id
                        ? 'bg-green-100'
                        : 'bg-gray-100 group-hover:bg-green-100'
                    }`}>
                      <format.icon className={`w-4 h-4 transition-colors ${
                        selectedFormat === format.id
                          ? 'text-green-600'
                          : 'text-gray-600 group-hover:text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{format.name}</h4>
                        <span className="text-xs text-gray-500 font-mono ml-2">{format.extension}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{format.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Export Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Include background</span>
                <input type="checkbox" defaultChecked className="accent-green-500 scale-90" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">High quality</span>
                <input type="checkbox" defaultChecked className="accent-green-500 scale-90" />
              </div>
              {(selectedFormat === 'png' || selectedFormat === 'jpg') && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">Scale factor</span>
                  <select className="text-xs border border-gray-200 rounded px-2 py-1">
                    <option value="1">1x</option>
                    <option value="2" selected>2x</option>
                    <option value="3">3x</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100/50 bg-gray-50/30">
          <button
            onClick={handleExport}
            disabled={exporting || !canvas}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-sm">Export as {exportFormats.find(f => f.id === selectedFormat)?.name}</span>
              </>
            )}
          </button>
        </div>


      </div>
    </div>
  );
}
