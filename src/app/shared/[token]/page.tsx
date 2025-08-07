'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Share2, ArrowLeft, ExternalLink, User } from 'lucide-react';
import { ProjectService } from '@/lib/projects/service';
import { Project } from '@/lib/projects/types';
import { STORAGE_KEY } from '@/components/canvas/types';

// Dynamic import to avoid SSR issues with canvas
const DiagramEditor = dynamic(() => import('@/components/editor/DiagramEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-lg text-gray-600">Loading Shared Diagram...</div>
    </div>
  ),
});

export default function SharedProjectPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadSharedProject = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const sharedProject = await ProjectService.getSharedProject(token);
        
        if (!sharedProject) {
          setError('Shared project not found or link has expired');
          setLoading(false);
          return;
        }

        setProject(sharedProject);

        // Load the canvas data into localStorage with a special key for shared projects
        const sharedStorageKey = `${STORAGE_KEY}_shared`;
        if (sharedProject.canvas_data) {
          localStorage.setItem(sharedStorageKey, JSON.stringify(sharedProject.canvas_data));
          
          // Also set it as the current canvas data for immediate viewing
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedProject.canvas_data));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading shared project:', error);
        setError('Failed to load shared project');
        setLoading(false);
      }
    };

    loadSharedProject();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading Shared Diagram...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Diagram</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const getUserEmail = (userId: string) => {
    // In a real app, you might want to fetch user details
    // For now, we'll just show a placeholder
    return 'Shared by a user';
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Shared Project Header */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        {/* Left Section - Back and Project Info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Back to homepage"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          
          <div className="h-4 w-px bg-gray-300" />
          
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">{project.name}</span>
            {project.is_public && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                Public
              </span>
            )}
          </div>
        </div>

        {/* Right Section - Project Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>Shared diagram</span>
          </div>
          
          <div className="h-4 w-px bg-gray-300" />
          
          <button
            onClick={() => router.push('/signin')}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Create Your Own
          </button>
        </div>
      </header>

      {/* Diagram Editor - Read-only mode */}
      <div className="flex-1 overflow-hidden">
        <DiagramEditor />
      </div>

      {/* Footer with sharing info */}
      <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Share2 className="w-3 h-3" />
          <span>This is a shared diagram. Changes are not saved.</span>
          <span>•</span>
          <button
            onClick={() => router.push('/signup')}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign up to create your own diagrams
          </button>
        </div>
      </div>
    </div>
  );
}
