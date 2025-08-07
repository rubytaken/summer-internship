'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  FileText, 
  Share2, 
  Download,
  Menu,
  LogOut,
  ChevronDown,
  Save,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { useDiagramStore } from '@/stores/diagramStore';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { useProjectSync } from '@/hooks/useProjectSync';
import ShareModal from '@/components/share/ShareModal';
import ExportModal from '@/components/export/ExportModal';
import { testSupabaseConnection } from '@/lib/debug/supabaseTest';

export default function Header() {
  const { projectName, setProjectName, setSelectedTool } = useDiagramStore();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Project sync functionality
  const { currentProjectId, saveToSupabase } = useProjectSync();

  const handleAIGenerate = () => {
    setSelectedTool('ai-suggest');
  };

  const handleSave = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }
    
    // Debug: Test connection before saving
    console.log('🔍 Testing connection before save...');
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest.authWorking) {
      console.error('❌ Auth not working for save operation');
      alert('Authentication error. Please sign out and sign in again.');
      return;
    }
    
    if (!currentProjectId) {
      console.warn('⚠️ No current project ID available for saving');
      alert('No project loaded. Please refresh the page.');
      return;
    }

    setSaving(true);
    try {
      console.log(`💾 Attempting to save project: ${currentProjectId}`);
      await saveToSupabase();
      console.log('✅ Manual save successful');
      alert('Project saved successfully!');
    } catch (error) {
      console.error('❌ Manual save failed:', error);
      alert(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (!user || !currentProjectId) {
      router.push('/signin');
      return;
    }
    setShowShareModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        {user && (
          <button 
            onClick={handleSave}
            disabled={saving || !currentProjectId}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save to cloud"
          >
            <Save className="w-3 h-3" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        )}
        
        <button 
          onClick={handleShare}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title={user ? "Share project" : "Sign in to share"}
        >
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
        
        <button 
          onClick={() => setShowExportModal(true)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
          title="Export diagram"
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>
        
        <button 
          onClick={() => setSelectedTool('ai-suggest')}
          className="p-2 hover:bg-purple-100 rounded-md transition-colors group" 
          title="AI Diagram Generator"
        >
          <Sparkles className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
        </button>
        
        {user && (
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors" 
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        <div className="h-4 w-px bg-gray-300" />
        
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {getUserInitials(user.email || '')}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Signed in as</p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => router.push('/signin')}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Sign in
            </button>
            <button 
              onClick={() => router.push('/signup')}
              className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              Sign up
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        projectId={currentProjectId}
        projectName={projectName}
      />
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </header>
  );
} 