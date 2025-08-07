'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  FileText, 
  Calendar, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink,
  Search,
  Grid,
  List,
  Filter
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { ProjectService } from '@/lib/projects/service';
import { Project } from '@/lib/projects/types';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Load user's projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userProjects = await ProjectService.getUserProjects();
        setProjects(userProjects);
        console.log('📊 Loaded user projects:', userProjects.length);
        console.log('📋 Project IDs:', userProjects.map(p => `${p.name}: ${p.id}`));
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create new project
  const handleCreateProject = () => {
    router.push('/diagram');
  };

  // Open project
  const handleOpenProject = (projectId: string) => {
    console.log('🔍 Opening project with ID:', projectId);
    router.push(`/diagram?project=${projectId}`);
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await ProjectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      console.log('🗑️ Project deleted:', projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AC</span>
                  </div>
                  <span className="font-semibold text-gray-800">AI Charts</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.email?.split('@')[0]}</span>
                <button
                  onClick={handleCreateProject}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {filteredProjects.length} projects
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading projects...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && projects.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Create your first diagram to get started</p>
              <button
                onClick={handleCreateProject}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create Project</span>
              </button>
            </div>
          )}

          {/* Projects Grid */}
          {!loading && filteredProjects.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-visible"
                  onClick={(e) => {
                    // Only open project if clicked on card itself, not on buttons
                    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.card-content')) {
                      handleOpenProject(project.id);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="card-content aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  {/* Content */}
                  <div className="card-content p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate flex-1">{project.name}</h3>
                      <div className="relative z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(selectedProject === project.id ? null : project.id);
                          }}
                          className="p-1 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {selectedProject === project.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] min-w-[140px]">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenProject(project.id);
                                  setSelectedProject(null);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Open Project</span>
                              </button>
                              
                              <div className="border-t border-gray-100"></div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newName = prompt('Enter new project name:', project.name);
                                  if (newName && newName.trim() && newName !== project.name) {
                                    // TODO: Implement rename functionality
                                    console.log('Rename project to:', newName);
                                  }
                                  setSelectedProject(null);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Rename</span>
                              </button>
                              
                              <div className="border-t border-gray-100"></div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                  setSelectedProject(null);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-50 text-left text-sm text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects List */}
          {!loading && filteredProjects.length > 0 && viewMode === 'list' && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-3">Last Modified</div>
                  <div className="col-span-2">Objects</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-visible"
                    onClick={(e) => {
                      // Only open project if clicked on row itself, not on buttons
                      if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button')) {
                        handleOpenProject(project.id);
                      }
                    }}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-6 flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{project.name}</span>
                      </div>
                      <div className="col-span-3 text-sm text-gray-600">
                        {formatDate(project.updated_at)}
                      </div>
                      <div className="col-span-2 text-sm text-gray-600">
                        {project.canvas_data?.objects?.length || 0} objects
                      </div>
                      <div className="col-span-1">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(selectedProject === project.id ? null : project.id);
                            }}
                            className="p-1 rounded-md hover:bg-gray-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {selectedProject === project.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] min-w-[140px]">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenProject(project.id);
                                    setSelectedProject(null);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>Open Project</span>
                                </button>
                                
                                <div className="border-t border-gray-100"></div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newName = prompt('Enter new project name:', project.name);
                                    if (newName && newName.trim() && newName !== project.name) {
                                      // TODO: Implement rename functionality
                                      console.log('Rename project to:', newName);
                                    }
                                    setSelectedProject(null);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Rename</span>
                                </button>
                                
                                <div className="border-t border-gray-100"></div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(project.id);
                                    setSelectedProject(null);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-50 text-left text-sm text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Search Results */}
          {!loading && filteredProjects.length === 0 && projects.length > 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">Try adjusting your search term</p>
            </div>
          )}
        </div>

        {/* Click outside to close dropdown */}
        {selectedProject && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setSelectedProject(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
