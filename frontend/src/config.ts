export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_URL;

if (!API_BASE_URL) {
  console.warn('VITE_API_URL is not defined in the environment');
}

export const CURRENT_USER = {
  id: 'user-123',
  username: 'jane.doe',
  fullName: 'Jane Doe',
};
