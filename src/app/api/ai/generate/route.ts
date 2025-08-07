import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DiagramGenerationRequest, DiagramGenerationResponse } from '@/lib/ai/gemini';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(API_KEY!);

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const body: DiagramGenerationRequest = await request.json();
    
    // Import the service functions here to avoid client-side execution
    const { GeminiAIService } = await import('@/lib/ai/gemini');
    const aiService = new GeminiAIService();
    
    const result = await aiService.generateDiagram(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagram' },
      { status: 500 }
    );
  }
} 