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
