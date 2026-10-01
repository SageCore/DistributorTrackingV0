import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import { loginApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('v2_auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('v2_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username: string, password?: string) => {
    const authResponse = await loginApi(username, password || '');
    setToken(authResponse.token);
    setUser(authResponse.user);
    localStorage.setItem('v2_auth_token', authResponse.token);
    localStorage.setItem('v2_user', JSON.stringify(authResponse.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('v2_auth_token');
    localStorage.removeItem('v2_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
