'use client';

import { useCallback, useRef } from 'react';

interface DragState {
  isDragging: boolean;
  draggedItem: string | null;
  dragPreview: HTMLElement | null;
}

interface UseDragAndDropProps {
  onDragStart?: (item: string) => void;
  onDragEnd?: () => void;
  onDrop?: (item: string, position: { x: number; y: number }) => void;
}

export function useDragAndDrop({ onDragStart, onDragEnd, onDrop }: UseDragAndDropProps = {}) {
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    draggedItem: null,
    dragPreview: null,
  });

  // Modern drag preview creation
  const createDragPreview = useCallback((shapeType: string): HTMLElement => {
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      width: 80px;
      height: 50px;
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      border: 2px solid #1E40AF;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: 600;
      font-family: Inter, sans-serif;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
      transform: rotate(3deg);
      transition: transform 0.2s ease;
    `;
    preview.textContent = shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
    document.body.appendChild(preview);
    return preview;
  }, []);

  // Enhanced drag start handler
  const handleDragStart = useCallback((e: React.DragEvent, shapeType: string) => {
    const state = dragStateRef.current;
    
    // Set drag data
    e.dataTransfer.setData('text/plain', shapeType);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create custom drag preview
    const preview = createDragPreview(shapeType);
    state.dragPreview = preview;
    
    // Set the drag image to be the preview element
    e.dataTransfer.setDragImage(preview, 40, 25);
    
    // Update state
    state.isDragging = true;
    state.draggedItem = shapeType;
    
    // Add drag classes for visual feedback
    const target = e.currentTarget as HTMLElement;
    target.classList.add('is-dragging');
    
    // Add body class for global drag state
    document.body.classList.add('is-dragging-shape');
    
    onDragStart?.(shapeType);
    
    console.log('🎯 Enhanced drag started:', shapeType);
  }, [createDragPreview, onDragStart]);

  // Enhanced drag end handler
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const state = dragStateRef.current;
    
    // Clean up drag preview
    if (state.dragPreview) {
      document.body.removeChild(state.dragPreview);
      state.dragPreview = null;
    }
    
    // Remove drag classes
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('is-dragging');
    document.body.classList.remove('is-dragging-shape');
    
    // Reset state
    state.isDragging = false;
    state.draggedItem = null;
    
    onDragEnd?.();
    
    console.log('🏁 Enhanced drag ended');
  }, [onDragEnd]);

  // Drop zone validation
  const validateDropZone = useCallback((e: DragEvent): boolean => {
    const target = e.target as HTMLElement;
    return target.tagName === 'CANVAS' || target.closest('.canvas-container') !== null;
  }, []);

  // Enhanced drop handler
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    
    if (!validateDropZone(e)) {
      console.log('❌ Invalid drop zone');
      return;
    }
    
    const shapeType = e.dataTransfer?.getData('text/plain');
    if (!shapeType) return;
    
    const position = {
      x: e.clientX,
      y: e.clientY
    };
    
    // Add drop animation feedback
    const dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    dropIndicator.style.cssText = `
      position: fixed;
      left: ${e.clientX - 15}px;
      top: ${e.clientY - 15}px;
      width: 30px;
      height: 30px;
      border: 3px solid #10B981;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      animation: dropPulse 0.6s ease-out forwards;
    `;
    
    document.body.appendChild(dropIndicator);
    
    setTimeout(() => {
      if (document.body.contains(dropIndicator)) {
        document.body.removeChild(dropIndicator);
      }
    }, 600);
    
    onDrop?.(shapeType, position);
    
    console.log('✅ Enhanced drop completed:', shapeType, position);
  }, [validateDropZone, onDrop]);

  // Drag over handler with visual feedback
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    
    if (validateDropZone(e)) {
      e.dataTransfer!.dropEffect = 'copy';
      const target = e.target as HTMLElement;
      const canvas = target.tagName === 'CANVAS' ? target : target.closest('canvas');
      if (canvas) {
        canvas.style.filter = 'brightness(1.05)';
      }
    } else {
      e.dataTransfer!.dropEffect = 'none';
    }
  }, [validateDropZone]);

  // Drag leave handler
  const handleDragLeave = useCallback((e: DragEvent) => {
    const target = e.target as HTMLElement;
    const canvas = target.tagName === 'CANVAS' ? target : target.closest('canvas');
    if (canvas) {
      canvas.style.filter = '';
    }
  }, []);

  return {
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    isDragging: dragStateRef.current.isDragging,
  };
}

// CSS animations to be added to global styles
export const dragAndDropStyles = `
  @keyframes dropPulse {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }

  .is-dragging {
    opacity: 0.6;
    transform: scale(0.95);
    transition: all 0.2s ease;
  }

  .is-dragging-shape canvas {
    transition: filter 0.2s ease;
  }

  .is-dragging-shape .canvas-container {
    position: relative;
  }

  .is-dragging-shape .canvas-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px dashed #3B82F6;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.05);
    pointer-events: none;
    opacity: 0;
    animation: borderPulse 1.5s ease-in-out infinite;
  }

  @keyframes borderPulse {
    0%, 100% {
      opacity: 0.3;
      border-color: #3B82F6;
    }
    50% {
      opacity: 0.7;
      border-color: #1D4ED8;
    }
  }

  .drag-preview {
    animation: dragFloat 0.2s ease-out;
  }

  @keyframes dragFloat {
    from {
      transform: rotate(0deg) scale(0.8);
      opacity: 0.8;
    }
    to {
      transform: rotate(3deg) scale(1);
      opacity: 1;
    }
  }
`;

