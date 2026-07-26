import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/AdminLoginForm';

export const metadata = {
  title: 'Admin Login | WECODE GCEK',
  description: 'Authenticate as administrator to manage coding competitions.',
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-zinc-500">Loading authentication form...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
