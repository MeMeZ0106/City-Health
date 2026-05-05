import React, { useEffect, useState } from 'react';
import { getCategories, uploadFile } from '../api/fileApi';
import { useAuth } from '../contexts/AuthContext';
import type { Category } from '../types';

const UploadForm: React.FC = () => {
  const { user, token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [uploaderName, setUploaderName] = useState<string>(user?.fullName || '');
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        if (data.length) {
          setCategoryId(data[0].id);
        }
      } catch (error) {
        setStatus({ message: 'Unable to load categories.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setStatus({ message: 'Please select a file.', type: 'error' });
    if (!categories.length) return setStatus({ message: 'Waiting for categories to load.', type: 'info' });
    if (!user || !token) return setStatus({ message: 'Authentication required.', type: 'error' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId.toString());
    formData.append('userId', user.id);
    formData.append('username', user.username);
    formData.append('fullName', uploaderName.trim());

    try {
      setUploading(true);
      setStatus({ message: 'Uploading document...', type: 'info' });
      await uploadFile(formData, token);
      setStatus({ message: 'File uploaded successfully!', type: 'success' });
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error(error);
      setStatus({ message: 'Upload failed. Please check the file and try again.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <div className="section-header">
        <h2>Upload New Document</h2>
      </div>
      
      <div className="upload-card">
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Uploader Full Name</label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Document Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                disabled={loading}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select File</label>
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                required
              />
              <small className="form-help">Supported formats: PDF, DOCX, JPG, PNG</small>
            </div>
          </div>

          <button 
            type="submit" 
            className="primary-button large" 
            disabled={loading || uploading || !file}
          >
            {uploading ? 'Processing...' : 'Upload Document'}
          </button>
        </form>
        
        {status.message && (
          <div className={`alert alert-${status.type} mt-1`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadForm;
