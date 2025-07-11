import { DiagramGenerationRequest, DiagramGenerationResponse, DiagramNode, DiagramConnection } from './gemini';

export class ClientAIService {
  async generateDiagram(request: DiagramGenerationRequest): Promise<DiagramGenerationResponse> {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate diagram');
      }

      return await response.json();
    } catch (error) {
      console.error('Client AI Service Error:', error);
      throw error;
    }
  }

  // Placeholder methods for future implementation via API routes
  async suggestImprovements(nodes: DiagramNode[], connections: DiagramConnection[]): Promise<string[]> {
    // TODO: Implement via API route
    return ['Add more descriptive labels', 'Consider color coding', 'Improve layout spacing'];
  }

  async generateReport(nodes: DiagramNode[], connections: DiagramConnection[], title: string): Promise<string> {
    // TODO: Implement via API route
    return `# ${title}\n\nThis diagram contains ${nodes.length} components with ${connections.length} connections.`;
  }
}

// Export client service instance
export const clientAIService = new ClientAIService(); 