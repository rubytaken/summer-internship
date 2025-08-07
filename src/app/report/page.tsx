'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <main className="h-screen w-screen overflow-hidden bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Reports</h1>
            <p className="text-gray-600">Reports feature will be implemented here.</p>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

