import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  province: string;
  cityMun: string;
  barangay: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signup: (
    email: string, 
    username: string, 
    fullName: string, 
    password: string, 
    confirmPassword: string,
    phoneNumber: string,
    address: string,
    province: string,
    cityMun: string,
    barangay: string
  ) => Promise<void>;
  updateProfile: (data: {
    fullName: string;
    phoneNumber: string;
    address: string;
    province: string;
    cityMun: string;
    barangay: string;
  }) => Promise<void>;
  getUsers: () => Promise<User[]>;
  adminUpdateUser: (targetUserId: string, data: {
    fullName: string;
    phoneNumber: string;
    address: string;
    province: string;
    cityMun: string;
    barangay: string;
  }) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (resetToken: string, password: string, confirmPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      // Verify token
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

  const login = async (email: string, password: string, captchaToken?: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
        captchaToken
      });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('authToken', newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const signup = async (
    email: string,
    username: string,
    fullName: string,
    password: string,
    confirmPassword: string,
    phoneNumber: string,
    address: string,
    province: string,
    cityMun: string,
    barangay: string
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        email,
        username,
        fullName,
        password,
        confirmPassword,
        phoneNumber,
        address,
        province,
        cityMun,
        barangay
      });
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

  const forgotPassword = async (email: string) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to process forgot password');
    }
  };

  const resetPassword = async (resetToken: string, password: string, confirmPassword: string) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        resetToken,
        password,
        confirmPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to reset password');
    }
  };

  const updateProfile = async (data: {
    fullName: string;
    phoneNumber: string;
    address: string;
    province: string;
    cityMun: string;
    barangay: string;
  }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const getUsers = async (): Promise<User[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users');
    }
  };

  const adminUpdateUser = async (targetUserId: string, data: any) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/user/${targetUserId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (targetUserId === user?.id) {
        setUser(response.data.user);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        updateProfile,
        getUsers,
        adminUpdateUser,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
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
