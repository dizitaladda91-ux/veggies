import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser as loginApi, registerUser as registerApi, logoutUser as logoutApi } from '../services/authService';
import { getAccessToken, clearTokens } from '../utils/storage';
import { ROUTES } from '../constants/routes';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const currUser = await getCurrentUser();
          setUser(currUser);
        } catch (err) {
          clearTokens();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const result = await loginApi(email, password);
    if (result.user) setUser(result.user);
    return result;
  };

  const register = async (formData) => {
    const userData = await registerApi(formData);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await logoutApi().catch(() => {});
    } finally {
      clearTokens();
      setUser(null);
      window.location.href = ROUTES.LOGIN;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
