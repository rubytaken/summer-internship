// Project related types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  canvas_data: any; // Canvas state as JSON
  is_public: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  canvas_data: any;
  is_public?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  canvas_data?: any;
  is_public?: boolean;
}

export interface ShareProjectRequest {
  project_id: string;
  is_public: boolean;
}
