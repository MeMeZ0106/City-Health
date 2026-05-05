import React, { useEffect, useState, useCallback } from 'react';
import { getFiles, searchFilesByUser, viewFile, deleteFile, updateFile, getCategories } from '../api/fileApi';
import { useAuth } from '../contexts/AuthContext';
import { UPLOADS_BASE_URL } from '../config';
import type { FileRecord, Category } from '../types';

const FileList: React.FC = () => {
  const { token } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<number>(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const computeCounts = useCallback((data: FileRecord[]) => {
    return data.reduce((counts, file) => {
      counts[file.category.name] = (counts[file.category.name] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, []);

  const fetchFiles = useCallback(async (searchTerm: string = '') => {
    if (!token) return;
    setLoading(true);
    setStatus('');
    try {
      const data = searchTerm.trim() 
        ? await searchFilesByUser(searchTerm, token)
        : await getFiles(token);
      
      setFiles(data);
      setCategoryCounts(computeCounts(data));
      
      if (searchTerm && data.length === 0) {
        setStatus(`No documents found for "${searchTerm}".`);
      }
    } catch (error) {
      console.error('Fetch failed', error);
      setStatus('Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }, [computeCounts, token]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📁';
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const catsData = await getCategories();
        setCategories(catsData);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (token) {
      fetchFiles(debouncedSearch);
    }
  }, [debouncedSearch, fetchFiles, token]);

  const handleView = async (file: FileRecord) => {
    if (!token) return;
    try {
      await viewFile(file.id, token);
      const fileUrl = `${UPLOADS_BASE_URL}/${file.storedName}`;
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('View failed', error);
      setStatus('Unable to record view activity or open file.');
    }
  };

  const handleDelete = async (file: FileRecord) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to delete "${file.originalName}"?`)) return;

    try {
      await deleteFile(file.id, token);
      setStatus(`Deleted ${file.originalName}`);
      await fetchFiles(debouncedSearch);
    } catch (error) {
      console.error('Delete failed', error);
      setStatus('Failed to delete file.');
    }
  };

  const startEdit = (file: FileRecord) => {
    setEditingId(file.id);
    setEditName(file.originalName);
    setEditCategory(file.category.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async () => {
    if (!editingId || !token) return;
    
    try {
      await updateFile(editingId, {
        originalName: editName,
        categoryId: editCategory
      }, token);
      setEditingId(null);
      setStatus('Document updated successfully.');
      await fetchFiles(debouncedSearch);
    } catch (error) {
      console.error('Update failed', error);
      setStatus('Failed to update document.');
    }
  };

  return (
    <div className="file-list-container">
      <div className="section-header">
        <h2>Document Dashboard</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by uploader name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <h4>Total Documents</h4>
          <p className="summary-value">{files.length}</p>
        </div>
        <div className="summary-card">
          <h4>Categories</h4>
          <p className="summary-value">{Object.keys(categoryCounts).length}</p>
        </div>
        <div className="summary-card">
          <h4>Latest Upload</h4>
          <p className="summary-value small">
            {files.length > 0 ? new Date(files[0].createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {status && <div className={`alert ${status.includes('failed') || status.includes('Unable') ? 'alert-error' : 'alert-success'}`}>{status}</div>}

      <div className="table-responsive">
        {loading ? (
          <div className="loader">Loading documents...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">No documents found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  {editingId === file.id ? (
                    <>
                      <td>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <select 
                          value={editCategory} 
                          onChange={(e) => setEditCategory(Number(e.target.value))}
                          className="edit-select"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>{file.uploadedBy.fullName}</td>
                      <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="text-right">
                        <button className="view-button" onClick={handleUpdate}>Save</button>
                        <button className="delete-button" onClick={cancelEdit}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="font-medium">
                        <span style={{marginRight: '8px'}}>{getFileIcon(file.originalName)}</span>
                        {file.originalName}
                      </td>
                      <td><span className="badge">{file.category.name}</span></td>
                      <td>{file.uploadedBy.fullName}</td>
                      <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="text-right">
                        <button className="view-button" style={{color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', background: 'rgba(245, 158, 11, 0.1)'}} onClick={() => startEdit(file)}>Edit</button>
                        <button className="view-button" onClick={() => handleView(file)}>View</button>
                        <button className="delete-button" onClick={() => handleDelete(file)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FileList;
