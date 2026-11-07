// src/context/AuthContext.js
// Global auth state shared across the app

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getCurrentUser,
  setCurrentUser,
  logout as storageLogout,
} from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const login = async (userObj) => {
    await setCurrentUser(userObj.email);
    setUser(userObj);
  };

  const logout = async () => {
    await storageLogout();
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await getCurrentUser();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
