import { useMemo } from 'react';

export function useAuth() {
  const isLoggedIn = useMemo(() => {
    try {
      const session = JSON.parse(localStorage.getItem('aarth_session') || 'null');
      return Boolean(session?.access_token);
    } catch {
      return false;
    }
  }, []);

  return { isLoggedIn };
}

export function useApp() {
  return {
    toast: (message: string) => {
      console.info('[AARTH Market Intelligence]', message);
    },
  };
}
