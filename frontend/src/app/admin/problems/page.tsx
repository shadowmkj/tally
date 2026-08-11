import { Suspense } from 'react';
import { AdminProblemsManager } from '@/components/AdminProblemsManager';

export const metadata = {
  title: 'Problem Management Studio | WECODE GCEK Admin',
  description: 'Manage, create, edit, and delete competition problems, test cases, and starter code templates.',
};

export default function AdminProblemsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      }
    >
      <AdminProblemsManager />
    </Suspense>
  );
}
