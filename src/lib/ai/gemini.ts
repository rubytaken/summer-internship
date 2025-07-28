import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateShapeSize, normalizeShapeSizes } from '@/lib/canvas/textUtils';

// Server-side only service - API key should be available in server environment
function getGoogleAI() {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.');
  }
  return new GoogleGenerativeAI(API_KEY);
}

export interface DiagramNode {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'ellipse' | 'triangle';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type?: 'arrow' | 'line';
}

export interface DiagramGenerationResponse {
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  title: string;
  description: string;
  suggestions: string[];
}

export interface DiagramGenerationRequest {
  prompt: string;
  diagramType: 'flowchart' | 'orgchart' | 'mindmap' | 'process' | 'network';
  style?: 'simple' | 'detailed' | 'technical';
  maxNodes?: number;
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private models: any[];
  private currentModelIndex = 0;

  constructor() {
    this.genAI = getGoogleAI();
    this.models = [
      this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }),     // Latest and best
      this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }),     // Reliable backup
      this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })      // Fallback
    ];
  }

  async generateDiagram(request: DiagramGenerationRequest): Promise<DiagramGenerationResponse> {
    const prompt = this.buildPrompt(request);
    
    // Retry logic with multiple models
    for (let attempt = 0; attempt < 3; attempt++) {
      for (let modelIndex = 0; modelIndex < this.models.length; modelIndex++) {
        let modelName = modelIndex === 0 ? 'gemini-2.5-flash' : 
                       modelIndex === 1 ? 'gemini-2.0-flash' : 'gemini-1.5-flash';
        try {
          const currentModel = this.models[modelIndex];
          
          console.log(`🤖 Attempt ${attempt + 1}, trying ${modelName}...`);
          console.log('Prompt preview:', prompt.substring(0, 200) + '...');
          
          const result = await currentModel.generateContent(prompt);
          const response = await result.response;
      
          if (!response) {
            throw new Error('No response received from Gemini API');
          }
          
          const text = response.text();
          console.log(`✅ Success with ${modelName}:`, text.substring(0, 100) + '...');
          
          // Parse JSON response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('No JSON found in response:', text);
            throw new Error('No valid JSON found in AI response');
          }
          
          const parsedResponse = JSON.parse(jsonMatch[0]);
          const validatedResponse = this.validateAndProcessResponse(parsedResponse);
          
          console.log(`🎉 Diagram generated successfully with ${modelName}`);
          return validatedResponse;
          
        } catch (error) {
          console.error(`❌ ${modelName} failed:`, error);
          
          // Check if it's a critical error that should not retry
          if (error instanceof Error) {
            if (error.message.includes('API key') || 
                error.message.includes('permission') ||
                error.message.includes('billing')) {
              throw error; // Don't retry on auth/billing issues
            }
            
            // For quota exceeded (429), wait longer before next attempt
            if (error.message.includes('429') || 
                error.message.includes('quota') ||
                error.message.includes('rate limit')) {
              console.log(`⏳ ${modelName} quota exceeded, waiting before next model...`);
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
              continue; // Try next model
            }
            
            // For 503 (overloaded), continue to next model quickly
            if (error.message.includes('503') || 
                error.message.includes('overloaded')) {
              console.log(`🔄 ${modelName} overloaded, trying next model...`);
              continue; // Try next model
            }
          }
          
          // For other errors, continue with next model
          console.log(`🔄 Retrying with next model...`);
        }
      }
      
      // Wait before next attempt with longer delays for quota issues
      if (attempt < 2) {
        const delay = Math.pow(3, attempt + 1) * 2000; // Longer exponential backoff (6s, 18s)
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All attempts failed
    throw new Error('Gemini API quota exceeded or service unavailable. Please check your API key limits in Google AI Studio and try again in a few minutes. If you continue having issues, consider upgrading your API plan.');
  }

  private validateAndProcessResponse(response: any): DiagramGenerationResponse {
    // Validate required fields
    if (!response.nodes || !Array.isArray(response.nodes)) {
      throw new Error('Invalid response: nodes array missing or invalid');
    }
    
    if (!response.connections || !Array.isArray(response.connections)) {
      throw new Error('Invalid response: connections array missing or invalid');
    }

    // First pass: create basic validated nodes
    const basicNodes: DiagramNode[] = response.nodes.map((node: any, index: number) => {
      return {
        id: node.id || `node_${index}`,
        type: this.validateNodeType(node.type),
        text: (node.text || `Node ${index + 1}`).substring(0, 50), // Allow longer text
        x: Math.max(50, Math.min(1400, node.x || 100 + index * 180)), // Wider canvas space
        y: Math.max(50, Math.min(1000, node.y || 100 + Math.floor(index / 6) * 150)), // More vertical space
        width: node.width || 120, // These will be recalculated
        height: node.height || 60,
        fill: this.validateColor(node.fill) || '#3B82F6',
        stroke: this.validateColor(node.stroke) || '#1F2937',
      };
    });

    // Second pass: calculate optimal sizes based on text content
    console.log('🔧 Calculating optimal sizes for text content...');
    const shapeSizes = normalizeShapeSizes(
      basicNodes.map(node => ({
        text: node.text,
        type: node.type,
        minWidth: node.type === 'circle' ? 80 : 100,
        minHeight: node.type === 'circle' ? 80 : 50
      }))
    );

    // Third pass: apply calculated sizes and adjust positions to prevent overlap
    const validatedNodes: DiagramNode[] = basicNodes.map((node, index) => {
      const optimalSize = shapeSizes[index];
      
      return {
        ...node,
        width: optimalSize.width,
        height: optimalSize.height,
        // Ensure nodes don't overlap by adjusting positions
        x: Math.max(50, node.x),
        y: Math.max(50, node.y),
      };
    });

    // Adjust positions to prevent overlaps
    this.preventNodeOverlaps(validatedNodes);

    // Validate connections
    const nodeIds = new Set(validatedNodes.map(n => n.id));
    const validatedConnections: DiagramConnection[] = response.connections
      .filter((conn: any) => nodeIds.has(conn.from) && nodeIds.has(conn.to))
      .map((conn: any) => ({
        from: conn.from,
        to: conn.to,
        label: conn.label || '',
        type: conn.type === 'line' ? 'line' : 'arrow',
      }));

    console.log(`✅ Processed ${validatedNodes.length} nodes with optimal text sizing`);

    return {
      nodes: validatedNodes,
      connections: validatedConnections,
      title: response.title || 'Generated Diagram',
      description: response.description || 'AI generated diagram with optimized text sizing',
      suggestions: Array.isArray(response.suggestions) ? response.suggestions.slice(0, 3) : [],
    };
  }

  private preventNodeOverlaps(nodes: DiagramNode[]): void {
    console.log('🎯 Preventing node overlaps...');
    
    const SPACING = 30; // Minimum spacing between nodes
    
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      
      for (let j = i + 1; j < nodes.length; j++) {
        const otherNode = nodes[j];
        
        // Check for overlap
        const currentRight = currentNode.x + currentNode.width;
        const currentBottom = currentNode.y + currentNode.height;
        const otherRight = otherNode.x + otherNode.width;
        const otherBottom = otherNode.y + otherNode.height;
        
        const overlapX = currentNode.x < otherRight + SPACING && currentRight + SPACING > otherNode.x;
        const overlapY = currentNode.y < otherBottom + SPACING && currentBottom + SPACING > otherNode.y;
        
        if (overlapX && overlapY) {
          // Move the second node to avoid overlap
          if (currentNode.x < otherNode.x) {
            // Move other node to the right
            otherNode.x = currentRight + SPACING;
          } else {
            // Move other node down
            otherNode.y = currentBottom + SPACING;
          }
          
          // Ensure we don't go out of bounds
          otherNode.x = Math.min(otherNode.x, 1400 - otherNode.width);
          otherNode.y = Math.min(otherNode.y, 1000 - otherNode.height);
        }
      }
    }
  }

  private buildPrompt(request: DiagramGenerationRequest): string {
    const { prompt, diagramType, style = 'simple', maxNodes = 10 } = request;
    
    const basePrompt = `You are an expert diagram generator.Do not compress yourself in terms of space, always create legible diagrams or flowcharts. do not show data on top of each other, everything should be neat and legible and pleasing to the eye. Create a ${diagramType} based on this description: "${prompt}"

Generate a diagram with ${style} style and maximum ${maxNodes} nodes.

IMPORTANT: Text content will be auto-sized to fit properly in shapes. Use descriptive but concise labels.

IMPORTANT: Return ONLY a valid JSON object with this EXACT structure (no additional text before or after):
{
  "title": "Diagram title",
  "description": "Brief description of the diagram",
  "nodes": [
    {
      "id": "unique_id",
      "type": "rectangle",
      "text": "descriptive node label (will auto-size)",
      "x": 100,
      "y": 100,
      "width": 120,
      "height": 60,
      "fill": "#3B82F6",
      "stroke": "#1F2937"
    }
  ],
  "connections": [
    {
      "from": "source_node_id",
      "to": "target_node_id",
      "label": "connection label",
      "type": "arrow"
    }
  ],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Text Guidelines:
- Use clear, descriptive labels (will be auto-sized)
- Keep text concise but meaningful
- For long processes, use brief descriptive names
- Text will automatically fit within shapes

Guidelines for ${diagramType}:`;

    const typeSpecificGuidelines = {
      flowchart: `
- Use rectangles for processes/actions (rounded corners)
- Use diamonds for decisions/conditions  
- Use circles for start/end points
- Arrange nodes in logical vertical flow with proper spacing
- ALWAYS create connections between nodes in sequence
- Include decision branches (Yes/No) with labeled connections
- Use curved arrow connections for better visual flow
- Colors: Blue (#3B82F6) for processes, Orange (#F59E0B) for decisions, Green (#10B981) for start/end
- Add connection labels (Yes/No for decisions, action names for processes)
- Text will auto-size, so use descriptive process names`,
      
      orgchart: `
- Use rectangles for all positions
- Arrange hierarchically (CEO at top)
- Include reporting relationships
- Show departments/teams clearly
- Colors: Different shades of blue for different levels
- Use full titles/names (will auto-size)`,
      
      mindmap: `
- Use circles for main topics
- Use rectangles for subtopics  
- Center the main topic
- Branch out radially
- Colors: Different colors for different branches
- Use descriptive topic names`,
      
      process: `
- Use rectangles for process steps
- Use diamonds for decision points
- Show clear sequence and flow
- Include swimlanes if multiple actors
- Colors: Consistent within process areas
- Describe each step clearly`,
      
      network: `
- Use circles for nodes/entities
- Use rectangles for services/systems
- Show connections and relationships
- Include network topology
- Colors: Different colors for different types
- Use system/service names`
    };

    const layoutGuidelines = `

Layout Guidelines (Infinite Canvas):
- Space nodes at least 200px apart vertically, 180px horizontally
- Use coordinates between 100-1400 for X, 80-1000 for Y (much larger canvas)
- Standard minimum sizes: rectangles (100x50), circles (radius 40), diamonds (100x70)
- Ensure no overlapping nodes - system will auto-adjust
- Create logical top-to-bottom or left-to-right flow
- IMPORTANT: Always add connections between related nodes
- For flowcharts: connect every process step in sequence
- For decisions: add both "Yes" and "No" path connections

Modern Visual Guidelines:
- Use rounded rectangles (rx: 8, ry: 8) for modern look
- Add subtle shadows and depth
- Ensure proper contrast and readability
- Use consistent spacing and alignment
- Text will auto-size to fit content perfectly

Connection Requirements:
- Every node should connect to at least one other node (except start/end)
- Decision nodes must have at least 2 outgoing connections
- Use descriptive connection labels ("Yes", "No", "Next", "Process", etc.)
- Connections should create a clear, logical flow

Color Scheme (use these exact hex codes):
- Primary: #3B82F6 (blue) - main processes
- Success: #10B981 (green) - start/end/success
- Warning: #F59E0B (orange) - decisions/warnings
- Error: #EF4444 (red) - errors/failures
- Secondary: #6B7280 (gray) - data/storage

CRITICAL: Return ONLY the JSON object, no markdown formatting, no additional text.
CRITICAL: Text content will be automatically sized to fit shapes - use descriptive labels.`;

    return basePrompt + typeSpecificGuidelines[diagramType] + layoutGuidelines;
  }

  private validateNodeType(type: string): DiagramNode['type'] {
    const validTypes: DiagramNode['type'][] = ['rectangle', 'circle', 'diamond', 'ellipse', 'triangle'];
    return validTypes.includes(type as DiagramNode['type']) ? type as DiagramNode['type'] : 'rectangle';
  }

  private validateColor(color: string): string | null {
    if (!color || typeof color !== 'string') return null;
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    return hexPattern.test(color) ? color : null;
  }

  async suggestImprovements(nodes: DiagramNode[], connections: DiagramConnection[]): Promise<string[]> {
    const prompt = `Analyze this diagram and suggest 3 improvements:

Nodes: ${JSON.stringify(nodes.map(n => ({ id: n.id, type: n.type, text: n.text })))}
Connections: ${JSON.stringify(connections)}

Return ONLY a JSON array of 3 short improvement suggestions:
["suggestion1", "suggestion2", "suggestion3"]`;

    try {
      // Use first available model for suggestions
      const result = await this.models[0].generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
      }
      return [];
    } catch (error) {
      console.error('Suggestion Error:', error);
      return ['Add more descriptive labels', 'Consider color coding', 'Improve layout spacing'];
    }
  }

  async generateReport(nodes: DiagramNode[], connections: DiagramConnection[], title: string): Promise<string> {
    const prompt = `Generate a professional report for this diagram:

Title: ${title}
Nodes: ${JSON.stringify(nodes.map(n => ({ type: n.type, text: n.text })))}
Connections: ${JSON.stringify(connections)}

Write a brief markdown report explaining:
1. Purpose and overview
2. Key components  
3. Process flow
4. Recommendations

Keep it under 500 words.`;

    try {
      // Use first available model for reports
      const result = await this.models[0].generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Report Generation Error:', error);
      return `# ${title}\n\nThis diagram contains ${nodes.length} components with ${connections.length} connections. The structure represents a workflow with clear input/output relationships.`;
    }
  }
}

// Server-side service - use clientAIService for client-side operations 