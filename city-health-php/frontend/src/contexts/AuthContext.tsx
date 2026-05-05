import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('authToken', newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const signup = async (data: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, data);
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('authToken', newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id // Temporary hack as implemented in PHP AuthController
        },
      });
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const getUsers = async (): Promise<User[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users');
    }
  };

  const adminUpdateUser = async (targetUserId: string, data: any) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/user/${targetUserId}`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
      });
      if (targetUserId === user?.id) {
        setUser(response.data.user);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateProfile, getUsers, adminUpdateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
