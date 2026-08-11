import { Suspense } from 'react';
import { AdminProblemForm } from '@/components/AdminProblemForm';

export const metadata = {
  title: 'Create Contest Problem | WECODE GCEK Admin',
  description: 'Add a new problem with complete specification, test cases, and starter templates.',
};

export default function CreateProblemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      }
    >
      <AdminProblemForm />
    </Suspense>
  );
}
