'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useOwnerAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/me`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          setIsOwner(false);
          router.push('/owner/login');
          return;
        }

        const userData = await response.json();
        const role = String(userData.role || '').toUpperCase();
        if (role === 'OWNER' || role === 'ADMIN') {
          setIsOwner(true);
          setUser(userData);
        } else {
          setIsOwner(false);
          router.push('/');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth check failed');
        setIsOwner(false);
        router.push('/owner/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { isLoading, isOwner, user, error };
}
