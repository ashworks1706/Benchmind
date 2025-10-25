'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const token = searchParams.get('token');
    const accessToken = searchParams.get('access_token');

    const handleAuth = async () => {
      if (errorParam) {
        setError(`Authentication failed: ${errorParam}. Please try again.`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!token || !accessToken) {
        setError('No authentication data received.');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      // Store tokens in localStorage
      try {
        localStorage.setItem('accessToken', accessToken);
        // Decode and store user data from token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.id,
          githubId: payload.github_id,
          username: payload.username,
          accessToken: accessToken
        };
        localStorage.setItem('user', JSON.stringify(user));
        
        router.push('/dashboard');
      } catch (err) {
        console.error('Auth error:', err);
        setError('Failed to complete authentication.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleAuth();
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
