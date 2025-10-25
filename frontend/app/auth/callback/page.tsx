'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (!code) {
      setError('No authentication code received.');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    authService.handleCallback(code)
      .then(() => {
        router.push('/dashboard');
      })
      .catch((err) => {
        console.error('Auth error:', err);
        setError('Failed to complete authentication.');
        setTimeout(() => router.push('/login'), 3000);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-900">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-xl font-semibold">{error}</div>
          <div className="text-muted-foreground">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-900">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <div className="text-xl font-semibold">Completing sign in...</div>
        <div className="text-muted-foreground">Please wait</div>
      </div>
    </div>
  );
}
