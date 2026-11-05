import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem('accessToken');
    if (!t) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data.user);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    const { user, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    const { user, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    setUser(user);
    return user;
  };

  const loginAsGuest = async () => {
    const { data } = await authAPI.guest();
    const { accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    setUser({ role: 'guest', name: 'Guest User' });
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => setUser(prev => ({ ...prev, ...updatedData }));

  const isAuthenticated = !!token && !!user;
  const isGuest = user?.role === 'guest';

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated, isGuest,
      login, register, loginAsGuest, logout, updateUser, loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
