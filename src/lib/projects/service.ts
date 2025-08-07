import { supabaseClient } from '@/lib/supabase/client';
import { Project, CreateProjectRequest, UpdateProjectRequest } from './types';

export class ProjectService {
  
  // Get all projects for current user
  static async getUserProjects(): Promise<Project[]> {
    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      console.error('Auth error when fetching projects:', authError);
      throw new Error('Authentication required');
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('📋 Fetching projects for user:', user.id);

    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('user_id', user.id) // Filter by user_id explicitly since RLS is simplified
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projects:', error);
      throw new Error('Failed to fetch projects');
    }

    console.log(`📊 Found ${data?.length || 0} projects for user`);
    return data || [];
  }

  // Get a specific project by ID
  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      console.error('Error fetching project:', error);
      throw new Error('Failed to fetch project');
    }

    return data;
  }

  // Get project by share token (for shared projects)
  static async getSharedProject(shareToken: string): Promise<Project | null> {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      console.error('Error fetching shared project:', error);
      throw new Error('Failed to fetch shared project');
    }

    return data;
  }

  // Create a new project
  static async createProject(projectData: CreateProjectRequest): Promise<Project> {
    console.log('🔧 Creating project with data:', projectData);
    
    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication required to create project');
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('👤 Current user:', user.id);

    const { data, error } = await supabaseClient
      .from('projects')
      .insert([{
        ...projectData,
        user_id: user.id // Explicitly set user_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Detailed Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to create project: ${error.message}`);
    }

    console.log('✅ Project created successfully:', data);
    return data;
  }

  // Update an existing project
  static async updateProject(projectId: string, updates: UpdateProjectRequest): Promise<Project> {
    // Get current user for verification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabaseClient
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', user.id) // Ensure user can only update their own projects
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }

    return data;
  }

  // Delete a project
  static async deleteProject(projectId: string): Promise<void> {
    // Get current user for verification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id); // Ensure user can only delete their own projects

    if (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  // Generate share token and make project shareable
  static async shareProject(projectId: string, isPublic: boolean = false): Promise<string> {
    // Get current user for verification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Generate a unique share token
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const { data, error } = await supabaseClient
      .from('projects')
      .update({ 
        share_token: shareToken,
        is_public: isPublic 
      })
      .eq('id', projectId)
      .eq('user_id', user.id) // Ensure user can only share their own projects
      .select()
      .single();

    if (error) {
      console.error('Error sharing project:', error);
      throw new Error('Failed to share project');
    }

    return shareToken;
  }

  // Remove share access (make private)
  static async unshareProject(projectId: string): Promise<void> {
    // Get current user for verification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { error } = await supabaseClient
      .from('projects')
      .update({ 
        share_token: null,
        is_public: false 
      })
      .eq('id', projectId)
      .eq('user_id', user.id); // Ensure user can only unshare their own projects

    if (error) {
      console.error('Error unsharing project:', error);
      throw new Error('Failed to unshare project');
    }
  }

  // Save current canvas state to project
  static async saveCanvasToProject(projectId: string, canvasData: any, projectName?: string): Promise<void> {
    const updates: UpdateProjectRequest = {
      canvas_data: canvasData
    };

    if (projectName) {
      updates.name = projectName;
    }

    await this.updateProject(projectId, updates);
  }

  // Auto-save functionality - save without explicit user action
  static async autoSaveProject(projectId: string, canvasData: any): Promise<void> {
    try {
      await this.saveCanvasToProject(projectId, canvasData);
      console.log(`🔄 Auto-saved project ${projectId}`);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't throw error for auto-save failures
    }
  }
}
