'use client';

import { useState } from 'react';
import { PromptInput } from '@/components/ui/ai-chat-input';

interface FloatingAIInputProps {
  onGenerate: (prompt: string) => Promise<void>;
}

export default function FloatingAIInput({ onGenerate }: FloatingAIInputProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (prompt: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      await onGenerate(prompt);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 p-4">
        <PromptInput
          placeholder="Describe your diagram... (e.g., 'Create a login process flowchart')"
          onSubmit={handleSubmit}
          disabled={isGenerating}
          className="border-purple-200 focus-within:border-purple-400 focus-within:ring-purple-400 shadow-none"
        />
        {isGenerating && (
          <div className="flex items-center justify-center mt-3 pt-2 border-t border-gray-100">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600 font-medium">Creating diagram...</span>
          </div>
        )}
      </div>
    </div>
  );
} 