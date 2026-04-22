export interface User {
  id: string;
  username: string;
  fullName: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface FileRecord {
  id: string;
  originalName: string;
  storedName: string;
  category: Category;
  uploadedBy: User;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  user: User;
  file?: FileRecord;
  action: string;
  timestamp: string;
}
