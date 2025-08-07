import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useDiagramStore } from '@/stores/diagramStore';
import { ProjectService } from '@/lib/projects/service';
import { STORAGE_KEY } from '@/components/canvas/types';
import { testSupabaseConnection, debugProjectCreation } from '@/lib/debug/supabaseTest';
import { loadCanvasState } from '@/components/canvas/CanvasHelpers';

export function useProjectSync() {
  const { user } = useAuth();
  const { projectName, canvas } = useDiagramStore();
  const currentProjectIdRef = useRef<string | null>(null);
  
  // Function to load specific project by ID
  const loadProject = useCallback(async (projectId: string) => {
    try {
      console.log('📂 Loading specific project:', projectId);
      const project = await ProjectService.getProject(projectId);
      
      if (!project) {
        console.error('❌ Project not found:', projectId);
        return false;
      }

      // Set current project
      currentProjectIdRef.current = project.id;
      
      // Update project name in store
      useDiagramStore.getState().setProjectName(project.name);
      
      // Load canvas data
      if (project.canvas_data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project.canvas_data));
        
        // Reload canvas manually to avoid infinite refresh
        if (canvas) {
          await loadCanvasState(canvas);
        }
      }
      
      console.log('✅ Project loaded successfully:', project.name);
      return true;
    } catch (error) {
      console.error('❌ Failed to load project:', error);
      return false;
    }
  }, [canvas]);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Get current canvas data from localStorage
  const getCanvasData = useCallback(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error('Error reading canvas data:', error);
      return null;
    }
  }, []);

  // Save current project to Supabase
  const saveToSupabase = useCallback(async (canvasData?: any) => {
    if (!user || !currentProjectIdRef.current) return;

    try {
      const dataToSave = canvasData || getCanvasData();
      if (!dataToSave) return;

      await ProjectService.saveCanvasToProject(
        currentProjectIdRef.current,
        dataToSave,
        projectName
      );

      console.log('💾 Project saved to Supabase');
    } catch (error) {
      console.error('Failed to save to Supabase:', error);
    }
  }, [user, projectName, getCanvasData]);

  // Auto-save with debouncing
  const scheduleAutoSave = useCallback((canvasData?: any) => {
    if (!user || !currentProjectIdRef.current) return;

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Schedule new auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      ProjectService.autoSaveProject(
        currentProjectIdRef.current!,
        canvasData || getCanvasData()
      );
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [user, getCanvasData]);

  // Load user's last project or create new one
  const initializeProject = useCallback(async () => {
    if (!user) {
      currentProjectIdRef.current = null;
      console.log('🚫 No user, skipping project initialization');
      return;
    }

    console.log('🔄 Initializing project for user:', user.id);

    // Debug: Test Supabase connection first
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.authWorking) {
      console.error('❌ Supabase auth not working, skipping project sync');
      return;
    }

    try {
      // Get user's projects
      console.log('📋 Fetching user projects...');
      const projects = await ProjectService.getUserProjects();
      console.log(`📊 Found ${projects.length} existing projects`);
      
      if (projects.length > 0) {
        // Load the most recent project
        const lastProject = projects[0];
        currentProjectIdRef.current = lastProject.id;
        
        // Update project name in store ONLY if it's still default
        if (projectName === 'Untitled Diagram' && lastProject.name !== projectName) {
          console.log('📝 Setting project name from DB:', lastProject.name);
          useDiagramStore.getState().setProjectName(lastProject.name);
        }

        // Load canvas data if it exists and localStorage is empty
        const currentLocalData = getCanvasData();
        if (!currentLocalData && lastProject.canvas_data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lastProject.canvas_data));
          
          // Reload canvas manually to avoid page refresh
          if (canvas) {
            await loadCanvasState(canvas);
          }
        }

        console.log(`📂 Loaded existing project: ${lastProject.name} (${lastProject.id})`);
      } else {
        // Create a new project
        console.log('🆕 No existing projects, creating new one...');
        const canvasData = getCanvasData() || { objects: [] };
        
        console.log('📦 Canvas data for new project:', {
          objectCount: canvasData.objects?.length || 0,
          hasData: !!canvasData
        });
        
        const projectData = {
          name: projectName || 'Untitled Diagram',
          canvas_data: canvasData,
          is_public: false
        };

        // Use debug helper to create project
        const newProject = await debugProjectCreation(projectData);
        
        if (!newProject) {
          throw new Error('Failed to create project via debug helper');
        }

        currentProjectIdRef.current = newProject.id;
        console.log(`🆕 Created new project: ${newProject.name} (${newProject.id})`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize project:', error);
      // Don't throw here, let the app continue to work without cloud sync
    }
  }, [user, projectName, canvas, getCanvasData]);

  // Initialize project when user logs in
  useEffect(() => {
    if (user) {
      // Add a small delay to ensure Supabase session is fully established
      const timer = setTimeout(() => {
        initializeProject();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      currentProjectIdRef.current = null;
    }
  }, [user, initializeProject]);

  // Save to Supabase when project name changes - IMMEDIATE SAVE
  useEffect(() => {
    if (user && currentProjectIdRef.current && projectName && projectName !== 'Untitled Diagram') {
      console.log('💾 Project name changed, saving immediately:', projectName);
      // Immediate save for project name changes
      const saveProjectName = async () => {
        try {
          await ProjectService.updateProject(currentProjectIdRef.current!, {
            name: projectName,
            updated_at: new Date().toISOString()
          });
          console.log('✅ Project name saved to Supabase:', projectName);
        } catch (error) {
          console.error('❌ Failed to save project name:', error);
        }
      };
      
      saveProjectName();
    }
  }, [user, projectName]);

  // Listen for localStorage changes (when canvas is saved)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const canvasData = JSON.parse(e.newValue);
          scheduleAutoSave(canvasData);
        } catch (error) {
          console.error('Error parsing storage data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [scheduleAutoSave]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentProjectId: currentProjectIdRef.current,
    saveToSupabase,
    scheduleAutoSave,
    initializeProject,
    loadProject
  };
}
