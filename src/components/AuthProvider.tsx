'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebaseAuth, getGoogleProvider } from '@/lib/firebase-client';
import { signInWithPopup } from 'firebase/auth';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'superadmin' | 'dono' | 'cliente';
  telefono?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  register: (data: { nombre: string; email: string; password: string; rol?: string; telefono?: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { setUser(d?.user || null); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setUser(data.user);
      return {};
    } catch { return { error: 'Error de conexión' }; }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleIdToken: idToken }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setUser(data.user);
      return {};
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/popup-closed-by-user') {
        return {};
      }
      return { error: 'Error al iniciar sesión con Google' };
    }
  };

  const register = async (formData: { nombre: string; email: string; password: string; rol?: string; telefono?: string }) => {
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      setUser(data.user);
      return {};
    } catch { return { error: 'Error de conexión' }; }
  };

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return c;
}
