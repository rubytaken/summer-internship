'use client';

import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/auth/protected-route';

// Dynamic import to avoid SSR issues with canvas
const DiagramEditor = dynamic(() => import('@/components/editor/DiagramEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-lg text-gray-600">Loading Editor...</div>
    </div>
  ),
});

export default function DiagramPage() {
  return (
    <ProtectedRoute>
      <main className="h-screen w-screen overflow-hidden bg-gray-50">
        <DiagramEditor />
      </main>
    </ProtectedRoute>
  );
} 