/**
 * Text measurement and auto-sizing utilities for canvas shapes
 */

export interface TextMetrics {
  width: number;
  height: number;
  lines: string[];
}

/**
 * Server-side fallback for text dimension estimation
 */
function estimateTextDimensions(
  text: string,
  fontSize: number = 14,
  maxWidth?: number
): TextMetrics {
  // Rough character width estimation based on font size
  const avgCharWidth = fontSize * 0.6; // Average character width
  const lineHeight = fontSize * 1.2; // Standard line height
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  if (maxWidth) {
    // Simple word wrapping based on estimated character width
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const estimatedWidth = testLine.length * avgCharWidth;
      
      if (estimatedWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  } else {
    lines.push(text);
  }
  
  // Calculate dimensions based on longest line
  const maxLineLength = Math.max(...lines.map(line => line.length));
  const width = maxLineLength * avgCharWidth;
  const height = lines.length * lineHeight;
  
  return {
    width: Math.ceil(width),
    height: Math.ceil(height),
    lines
  };
}

export interface ShapeSize {
  width: number;
  height: number;
  padding: number;
}

/**
 * Measures text dimensions using canvas context
 */
export function measureText(
  text: string,
  fontSize: number = 14,
  fontFamily: string = 'Inter, sans-serif',
  fontWeight: string = '500',
  maxWidth?: number
): TextMetrics {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    // Server-side fallback: estimate text dimensions
    return estimateTextDimensions(text, fontSize, maxWidth);
  }

  // Create a temporary canvas for text measurement
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return estimateTextDimensions(text, fontSize, maxWidth);
  }

  // Set font properties
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Split text into words for wrapping
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  if (maxWidth) {
    // Word wrapping logic
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  } else {
    lines.push(text);
  }
  
  // Calculate dimensions
  let maxLineWidth = 0;
  for (const line of lines) {
    const lineWidth = ctx.measureText(line).width;
    maxLineWidth = Math.max(maxLineWidth, lineWidth);
  }
  
  const lineHeight = fontSize * 1.2; // 1.2 is typical line height ratio
  const totalHeight = lines.length * lineHeight;
  
  return {
    width: Math.ceil(maxLineWidth),
    height: Math.ceil(totalHeight),
    lines
  };
}

/**
 * Calculates optimal shape size based on text content
 */
export function calculateShapeSize(
  text: string,
  shapeType: 'rectangle' | 'circle' | 'diamond' | 'ellipse' | 'triangle',
  fontSize: number = 14,
  fontFamily: string = 'Inter, sans-serif',
  fontWeight: string = '500',
  minWidth: number = 80,
  minHeight: number = 40
): ShapeSize {
  if (!text.trim()) {
    return { width: minWidth, height: minHeight, padding: 16 };
  }

  // Base padding for different shape types
  const basePadding = {
    rectangle: 16,
    circle: 20,
    diamond: 24,
    ellipse: 20,
    triangle: 20
  };

  const padding = basePadding[shapeType];
  
  // For circles and diamonds, we need to account for different text fitting
  let maxTextWidth: number;
  
  switch (shapeType) {
    case 'circle':
      // For circles, text should fit in a square inscribed in the circle
      // So we limit text width to about 70% of diameter for good visual balance
      maxTextWidth = Math.max(120, minWidth * 0.7);
      break;
      
    case 'diamond':
      // For diamonds, text fits in the middle area (about 60% of width)
      maxTextWidth = Math.max(100, minWidth * 0.6);
      break;
      
    case 'triangle':
      // For triangles, text fits in the lower portion
      maxTextWidth = Math.max(80, minWidth * 0.8);
      break;
      
    default:
      // Rectangle and ellipse can use most of their width
      maxTextWidth = Math.max(150, minWidth - padding);
  }

  const textMetrics = measureText(text, fontSize, fontFamily, fontWeight, maxTextWidth);
  
  let finalWidth: number;
  let finalHeight: number;
  
  switch (shapeType) {
    case 'circle':
      // For circles, we need the diameter to fit the text comfortably
      const circleSize = Math.max(
        textMetrics.width + padding * 2,
        textMetrics.height + padding * 2,
        minWidth
      );
      finalWidth = finalHeight = circleSize;
      break;
      
    case 'diamond':
      // For diamonds, we need extra space due to the angled sides
      finalWidth = Math.max(textMetrics.width + padding * 2.5, minWidth);
      finalHeight = Math.max(textMetrics.height + padding * 2, minHeight);
      break;
      
    case 'triangle':
      // For triangles, wider base for better text fit
      finalWidth = Math.max(textMetrics.width + padding * 1.5, minWidth);
      finalHeight = Math.max(textMetrics.height + padding * 2, minHeight);
      break;
      
    default:
      // Rectangle and ellipse
      finalWidth = Math.max(textMetrics.width + padding, minWidth);
      finalHeight = Math.max(textMetrics.height + padding, minHeight);
  }
  
  return {
    width: Math.ceil(finalWidth),
    height: Math.ceil(finalHeight),
    padding
  };
}

/**
 * Auto-sizes multiple shapes to maintain visual consistency
 */
export function normalizeShapeSizes(
  shapes: Array<{ text: string; type: string; minWidth?: number; minHeight?: number }>
): ShapeSize[] {
  const sizes = shapes.map(shape => 
    calculateShapeSize(
      shape.text, 
      shape.type as any,
      14,
      'Inter, sans-serif',
      '500',
      shape.minWidth || 80,
      shape.minHeight || 40
    )
  );
  
  // Find the maximum dimensions for consistency
  const maxWidth = Math.max(...sizes.map(s => s.width));
  const maxHeight = Math.max(...sizes.map(s => s.height));
  
  // Apply some normalization rules
  return sizes.map(size => ({
    ...size,
    width: Math.max(size.width, maxWidth * 0.7), // Minimum 70% of max width
    height: Math.max(size.height, maxHeight * 0.8) // Minimum 80% of max height
  }));
}

/**
 * Creates optimal text positioning within a shape
 */
export function getTextPosition(
  shapeX: number,
  shapeY: number,
  shapeWidth: number,
  shapeHeight: number,
  shapeType: 'rectangle' | 'circle' | 'diamond' | 'ellipse' | 'triangle'
): { x: number; y: number } {
  const centerX = shapeX + shapeWidth / 2;
  const centerY = shapeY + shapeHeight / 2;
  
  switch (shapeType) {
    case 'triangle':
      // Position text in lower 2/3 of triangle
      return {
        x: centerX,
        y: shapeY + (shapeHeight * 0.65)
      };
      
    case 'diamond':
      // Keep text perfectly centered in diamond
      return {
        x: centerX,
        y: centerY
      };
      
    default:
      // Center for all other shapes
      return {
        x: centerX,
        y: centerY
      };
  }
} 