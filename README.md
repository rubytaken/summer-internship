# AI Charts - Technical Requirements Document

_Version 1.0 | June 2025_

## 🎯 Product Overview

**AI Charts** is a web-based diagramming platform that combines visual editing with AI-powered diagram generation. Users can create flowcharts, org charts, and technical diagrams through natural language input or traditional drawing tools.

**Core Features:**

- Visual diagram editor with canvas manipulation
- AI-powered diagram generation from text descriptions
- Real-time collaboration
- Export functionality (PDF, PNG, SVG)
- Template library

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Canvas**: Fabric.js
- **State**: Zustand
- **Real-time**: Socket.io-client

### Backend & Database

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **API**: Supabase Edge Functions

### AI Integration

- **Model**: Google Gemini 2.5 Flash
- **Processing**: Structured prompts with JSON validation

---

## 🗄️ Database Schema (Supabase PostgreSQL)

```sql
-- User profiles
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagrams (stores canvas data and metadata)
CREATE TABLE diagrams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'flowchart', 'orgchart', 'mindmap', 'network'
  canvas_data JSONB NOT NULL, -- Complete Fabric.js canvas state
  thumbnail_url TEXT, -- Generated preview image
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT, -- Original AI prompt if generated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports (AI-generated analysis and documentation)
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL, -- 'analysis', 'documentation', 'summary'
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Generated report content
  format TEXT DEFAULT 'markdown', -- 'markdown', 'plain', 'html'
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration
CREATE TABLE project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Templates
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  canvas_data JSONB NOT NULL,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI generation logs
CREATE TABLE ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  diagram_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  result_data JSONB, -- Generated diagram data
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can access their own projects and collaborations
CREATE POLICY "Users access own projects" ON projects
FOR ALL USING (
  auth.uid() = owner_id OR
  EXISTS (SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid())
);

CREATE POLICY "Users access project diagrams" ON diagrams
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = diagrams.project_id AND (
      projects.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users access diagram reports" ON reports
FOR ALL USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM diagrams d
    JOIN projects p ON d.project_id = p.id
    WHERE d.id = reports.diagram_id AND (
      p.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM project_collaborators WHERE project_id = p.id AND user_id = auth.uid())
    )
  )
);
```

---

## 🎨 UI Architecture

### Layout Structure

```
┌─────────────────────────────────────────────┐
│ Header: Logo | Project | Share | User       │
├─────────────────────────────────────────────┤
│ Toolbar: Shapes | AI | Export | Zoom        │
├─────────┬───────────────────────┬───────────┤
│ Shapes  │      Canvas Area      │Properties │
│ Panel   │                       │Panel      │
│         │                       │           │
│- Basic  │                       │- Style    │
│- AI Gen │                       │- AI Tools │
│- Custom │                       │- Reports  │
└─────────┴───────────────────────┴───────────┘
```

### Key Components

- **Canvas**: Fabric.js-based drawing area
- **Shape Panel**: Draggable shapes and AI generation
- **Properties Panel**: Style controls and AI features
- **AI Assistant**: Natural language diagram generation
- **Export Panel**: Download options and report generation

---

## 🤖 AI Implementation

### Prompt Structure

```typescript
interface AIPrompt {
  userInput: string;
  diagramType: "flowchart" | "orgchart" | "mindmap";
  context?: string;
}

interface AIResponse {
  nodes: {
    id: string;
    type: "rectangle" | "diamond" | "oval" | "circle";
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  connections: {
    from: string;
    to: string;
    label?: string;
  }[];
  suggestions: string[];
}
```

### AI Services

```typescript
// AI diagram generation
async function generateDiagram(prompt: AIPrompt): Promise<AIResponse>;

// AI report generation
async function generateReport(
  diagramData: any,
  reportType: string
): Promise<string>;

// AI suggestions
async function getSuggestions(canvasData: any): Promise<string[]>;
```

---

## 📋 Development Tasks

### Phase 1: Core Infrastructure (4 weeks)

- [ ] Next.js setup with TypeScript and Tailwind
- [ ] Supabase PostgreSQL setup and schema implementation
- [ ] Authentication system
- [ ] Basic routing and layout components

### Phase 2: Canvas & Drawing (4 weeks)

- [ ] Fabric.js integration
- [ ] Shape creation and manipulation
- [ ] Toolbar and properties panel
- [ ] Save/load functionality
- [ ] Export to PNG/PDF/SVG

### Phase 3: AI Integration (4 weeks)

- [ ] Gemini API integration
- [ ] Text-to-diagram conversion
- [ ] AI report generation
- [ ] AI suggestion system
- [ ] Error handling and validation

### Phase 4: Collaboration (3 weeks)

- [ ] Real-time editing with WebSockets
- [ ] User presence indicators
- [ ] Project sharing
- [ ] Version history

### Phase 5: Polish & Deploy (1 week)

- [ ] Performance optimization
- [ ] Error handling
- [ ] Testing
- [ ] Production deployment

---

## 🔧 Technical Requirements

### Canvas Features

- Infinite scrolling and zooming
- Shape library (rectangles, circles, diamonds, arrows)
- Smart connectors with auto-routing
- Multi-select and grouping
- Undo/redo functionality
- Copy/paste operations

### AI Features

- Natural language to diagram conversion
- Multiple diagram types support
- Report generation from diagrams
- Layout optimization suggestions
- Content improvement recommendations

### Data Storage

- All diagrams saved to Supabase PostgreSQL
- Real-time synchronization
- Version control
- Export functionality
- Report archival

### Performance Targets

- Canvas load time: < 2 seconds
- AI generation: < 10 seconds
- Real-time sync: < 100ms latency
- Export generation: < 5 seconds

---

## 🚀 Deployment & Environment

### Development

```bash
pnpm install
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Production

- Vercel deployment
- Supabase PostgreSQL production database
- CDN for static assets
- Environment variable management
