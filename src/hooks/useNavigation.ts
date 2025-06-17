import { useRouter as useNextRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useNavigation() {
  const router = useNextRouter();

  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined' && !router) {
      window.location.href = path;
      return;
    }
    router.push(path);
  }, [router]);

  const getPath = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '';
  }, []);

  return { navigate, pathname: getPath() };
}