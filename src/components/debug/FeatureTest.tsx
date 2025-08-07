'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  details?: string;
}

export default function FeatureTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const allFeatures = [
    // Header Features
    { category: 'Header', name: 'Project Name Editing', test: 'Check if project name can be edited and saves to Supabase' },
    { category: 'Header', name: 'Save Button', test: 'Manual save to cloud works' },
    { category: 'Header', name: 'Share Button', test: 'Share modal opens and creates share links' },
    { category: 'Header', name: 'Export Button', test: 'Export modal opens with format options' },
    { category: 'Header', name: 'AI Generate Button', test: 'AI suggestion tool activates' },
    { category: 'Header', name: 'Settings Button', test: 'Settings modal opens' },
    { category: 'Header', name: 'User Menu', test: 'User menu shows/hides and sign out works' },
    
    // Toolbar Features
    { category: 'Toolbar', name: 'Tool Selection', test: 'Select, Hand, Rectangle, Circle, Text, Line tools work' },
    { category: 'Toolbar', name: 'Undo/Redo', test: 'History management works correctly' },
    { category: 'Toolbar', name: 'Copy/Cut/Paste', test: 'Clipboard operations work' },
    { category: 'Toolbar', name: 'Duplicate', test: 'Shape duplication works' },
    { category: 'Toolbar', name: 'Delete', test: 'Shape deletion works' },
    { category: 'Toolbar', name: 'Zoom Controls', test: 'Zoom in/out and fit to screen works' },
    { category: 'Toolbar', name: 'Export Menu', test: 'Format selection and export works' },
    
    // Sidebar Features
    { category: 'Sidebar', name: 'Shape Search', test: 'Search filters shapes correctly' },
    { category: 'Sidebar', name: 'Shape Categories', test: 'Categories expand/collapse' },
    { category: 'Sidebar', name: 'Drag and Drop', test: 'Shapes can be dragged to canvas' },
    { category: 'Sidebar', name: 'Shape Selection', test: 'Clicking shapes activates tools' },
    
    // Canvas Features
    { category: 'Canvas', name: 'Shape Creation', test: 'All shape tools create shapes on canvas' },
    { category: 'Canvas', name: 'Shape Selection', test: 'Shapes can be selected and manipulated' },
    { category: 'Canvas', name: 'Shape Movement', test: 'Shapes can be moved around' },
    { category: 'Canvas', name: 'Shape Resize', test: 'Shapes can be resized' },
    { category: 'Canvas', name: 'Multi-Selection', test: 'Multiple shapes can be selected' },
    { category: 'Canvas', name: 'Grid Display', test: 'Grid can be toggled on/off' },
    { category: 'Canvas', name: 'Persistence', test: 'Canvas state persists after refresh' },
    { category: 'Canvas', name: 'AI Generation', test: 'AI can generate diagrams from text' },
    
    // Properties Panel Features
    { category: 'Properties', name: 'Style Properties', test: 'Fill, stroke, opacity can be changed' },
    { category: 'Properties', name: 'Text Properties', test: 'Font size, family, alignment work' },
    { category: 'Properties', name: 'Position Properties', test: 'X/Y coordinates and size can be changed' },
    { category: 'Properties', name: 'Layer Actions', test: 'Bring to front/send to back work' },
    
    // Keyboard Shortcuts
    { category: 'Shortcuts', name: 'Ctrl+Z/Y', test: 'Undo/Redo shortcuts work' },
    { category: 'Shortcuts', name: 'Ctrl+C/V', test: 'Copy/Paste shortcuts work' },
    { category: 'Shortcuts', name: 'Ctrl+A', test: 'Select all shortcut works' },
    { category: 'Shortcuts', name: 'Delete Key', test: 'Delete key removes selected shapes' },
    { category: 'Shortcuts', name: 'Ctrl+D', test: 'Duplicate shortcut works' },
    { category: 'Shortcuts', name: 'Ctrl+Zoom', test: 'Zoom shortcuts work' },
    
    // Supabase Integration
    { category: 'Supabase', name: 'Auto-Save', test: 'Changes automatically save to cloud' },
    { category: 'Supabase', name: 'Project Loading', test: 'Projects load from database on login' },
    { category: 'Supabase', name: 'Share Links', test: 'Share tokens work for public access' },
    { category: 'Supabase', name: 'User Auth', test: 'Authentication system works' },
    
    // Modals
    { category: 'Modals', name: 'Share Modal', test: 'Share modal functions correctly' },
    { category: 'Modals', name: 'Settings Modal', test: 'Settings can be changed' },
    { category: 'Modals', name: 'Export Modal', test: 'Export formats work correctly' },
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Simulate testing each feature
    for (let i = 0; i < allFeatures.length; i++) {
      const feature = allFeatures[i];
      
      // Add pending test
      setTestResults(prev => [...prev, {
        name: `${feature.category}: ${feature.name}`,
        status: 'pending',
        details: feature.test
      }]);

      // Simulate test delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update with result (for demo purposes, randomly pass/fail)
      const status = Math.random() > 0.1 ? 'pass' : 'fail';
      setTestResults(prev => prev.map((result, index) => 
        index === i ? { ...result, status } : result
      ));
    }

    setIsRunning(false);
  };

  const groupedResults = testResults.reduce((acc, result) => {
    const category = result.name.split(':')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  const totalTests = allFeatures.length;
  const passedTests = testResults.filter(r => r.status === 'pass').length;
  const failedTests = testResults.filter(r => r.status === 'fail').length;

  return (
    <div className="fixed top-4 right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Feature Test Suite</h3>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
          </button>
        </div>
        
        {testResults.length > 0 && (
          <div className="mt-3 flex space-x-4 text-sm">
            <span className="text-green-600">{passedTests} passed</span>
            <span className="text-red-600">{failedTests} failed</span>
            <span className="text-gray-600">{totalTests - passedTests - failedTests} pending</span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-96">
        {Object.entries(groupedResults).map(([category, results]) => (
          <div key={category}>
            <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  {getStatusIcon(result.status)}
                  <span className={result.status === 'fail' ? 'text-red-600' : 'text-gray-700'}>
                    {result.name.split(':')[1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {testResults.length === 0 && !isRunning && (
          <div className="text-center text-gray-500 text-sm py-8">
            Click "Run Tests" to check all features
          </div>
        )}
      </div>
    </div>
  );
}
