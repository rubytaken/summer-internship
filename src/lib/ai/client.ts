import { DiagramGenerationRequest, DiagramGenerationResponse, DiagramNode, DiagramConnection } from './gemini';

export class ClientAIService {
  private lastRequestTime = 0;
  private readonly minRequestInterval = 2000; // Minimum 2 seconds between requests

  async generateDiagram(request: DiagramGenerationRequest): Promise<DiagramGenerationResponse> {
    // Rate limiting: ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
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
        const errorMessage = error.error || 'Failed to generate diagram';
        
        // Provide user-friendly error messages
        if (response.status === 429) {
          throw new Error('API quota exceeded. Please wait a few minutes and try again, or check your API limits in Google AI Studio.');
        } else if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again in a moment.');
        } else if (response.status === 500 && errorMessage.includes('quota')) {
          throw new Error('API quota exceeded. Please check your Gemini API limits and try again later.');
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Client AI Service Error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
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