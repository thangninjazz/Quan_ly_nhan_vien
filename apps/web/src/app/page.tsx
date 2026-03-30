'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rolesJson = localStorage.getItem('roles');

    if (!token) {
      router.push('/login');
    } else {
      try {
        const roles = JSON.parse(rolesJson || '[]');
        if (roles.includes('Admin')) {
          router.push('/admin');
        } else if (roles.includes('Manager')) {
          router.push('/manager');
        } else {
          router.push('/employee');
        }
      } catch (e) {
        router.push('/login');
      }
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
    </div>
  );
}
