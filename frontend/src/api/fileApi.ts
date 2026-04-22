import axios from 'axios';
import type { Category, FileRecord, ActivityLog } from '../types';
import { API_BASE_URL } from '../config';

export const uploadFile = async (formData: FormData) => {
  const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getFiles = async (): Promise<FileRecord[]> => {
  const response = await axios.get(`${API_BASE_URL}/files`);
  return response.data;
};

export const searchFilesByUser = async (username: string): Promise<FileRecord[]> => {
  const response = await axios.get(`${API_BASE_URL}/files/user/${username}`);
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(`${API_BASE_URL}/files/categories`);
  return response.data;
};

export const getLogs = async (): Promise<ActivityLog[]> => {
  const response = await axios.get(`${API_BASE_URL}/logs`);
  return response.data;
};

export const viewFile = async (
  id: string,
  userId: string,
  fullName: string,
  username: string,
): Promise<FileRecord> => {
  const response = await axios.get(`${API_BASE_URL}/files/${id}`, {
    params: {
      userId,
      fullName,
      username,
    },
  });
  return response.data;
};

export const updateFile = async (
  id: string,
  data: { 
    originalName: string; 
    categoryId: number;
    userId: string;
    fullName: string;
    username: string;
  }
): Promise<{ message: string; file: FileRecord }> => {
  const response = await axios.patch(`${API_BASE_URL}/files/${id}`, data);
  return response.data;
};

export const deleteFile = async (
  id: string,
  userId: string,
  fullName: string,
  username: string,
): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_BASE_URL}/files/${id}`, {
    params: {
      userId,
      fullName,
      username,
    },
  });
  return response.data;
};
