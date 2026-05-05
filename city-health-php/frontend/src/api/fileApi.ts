import axios from 'axios';
import type { Category, FileRecord, ActivityLog } from '../types';
import { API_BASE_URL } from '../config';

const createAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
});

export const uploadFile = async (formData: FormData, token: string) => {
  const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...createAuthHeaders(token),
    },
  });
  return response.data;
};

export const getFiles = async (token: string): Promise<FileRecord[]> => {
  const response = await axios.get(`${API_BASE_URL}/files`, {
    headers: createAuthHeaders(token),
  });
  return response.data;
};

export const searchFilesByUser = async (username: string, token: string): Promise<FileRecord[]> => {
  const response = await axios.get(`${API_BASE_URL}/files/user/${username}`, {
    headers: createAuthHeaders(token),
  });
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(`${API_BASE_URL}/categories`);
  return response.data;
};

export const getLogs = async (token: string): Promise<ActivityLog[]> => {
  const response = await axios.get(`${API_BASE_URL}/logs`, {
    headers: createAuthHeaders(token),
  });
  return response.data;
};

export const viewFile = async (
  id: string,
  token: string,
): Promise<FileRecord> => {
  const response = await axios.get(`${API_BASE_URL}/files/${id}`, {
    headers: createAuthHeaders(token),
  });
  return response.data;
};

export const updateFile = async (
  id: string,
  data: { 
    originalName: string; 
    categoryId: number;
  },
  token: string,
): Promise<{ message: string; file: FileRecord }> => {
  const response = await axios.patch(`${API_BASE_URL}/files/${id}`, data, {
    headers: createAuthHeaders(token),
  });
  return response.data;
};

export const deleteFile = async (
  id: string,
  token: string,
): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_BASE_URL}/files/${id}`, {
    headers: createAuthHeaders(token),
  });
  return response.data;
};
