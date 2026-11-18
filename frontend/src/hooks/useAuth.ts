import { useCallback, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../services/api';
import type { User } from '../types/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const controller = new AbortController();
    api
      .me(controller.signal)
      .then(setUser)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setStoredToken(null);
        setUser(null);
      });

    return () => controller.abort();
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  return { user, setUser, logout };
}
