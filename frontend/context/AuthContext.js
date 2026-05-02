'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';
import { getSocket, disconnectSocket } from '@/lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('skillswap_token');
      if (!token) { setLoading(false); return; }

      try {
        const res = await authAPI.getMe();
        setUser(res.data.user);
        const s = getSocket();
        setSocket(s);
      } catch {
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('skillswap_token', res.data.token);
    localStorage.setItem('skillswap_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    const s = getSocket();
    setSocket(s);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    localStorage.setItem('skillswap_token', res.data.token);
    localStorage.setItem('skillswap_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    const s = getSocket();
    setSocket(s);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_user');
    disconnectSocket();
    setSocket(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, socket, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
