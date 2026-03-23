'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthUser, UserRole, DUMMY_USERS } from '@/lib/auth';

const AUTH_STORAGE_KEY = 'qrapp_role';

interface AuthContextValue {
  user: AuthUser | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY) as UserRole | null;
    if (saved && DUMMY_USERS[saved]) {
      setUser(DUMMY_USERS[saved]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [ready, user, pathname, router]);

  const login = (role: UserRole) => {
    const u = DUMMY_USERS[role];
    setUser(u);
    localStorage.setItem(AUTH_STORAGE_KEY, role);
    router.push('/list');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!ready && pathname !== '/login' ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
