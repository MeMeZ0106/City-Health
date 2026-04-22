import React, { useEffect, useState, useCallback } from 'react';
import { getFiles, searchFilesByUser, viewFile, deleteFile, updateFile, getCategories } from '../api/fileApi';
import { CURRENT_USER, UPLOADS_BASE_URL } from '../config';
import type { FileRecord, Category } from '../types';

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<number>(0);

  const computeCounts = useCallback((data: FileRecord[]) => {
    return data.reduce((counts, file) => {
      counts[file.category.name] = (counts[file.category.name] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setStatus('');
    try {
      const [filesData, catsData] = await Promise.all([getFiles(), getCategories()]);
      setFiles(filesData);
      setCategories(catsData);
      setCategoryCounts(computeCounts(filesData));
    } catch (error) {
      console.error('Failed to fetch files', error);
      setStatus('Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }, [computeCounts]);

  const handleSearch = async () => {
    if (!search.trim()) {
      await fetchFiles();
      return;
    }

    setLoading(true);
    setStatus('');
    try {
      const data = await searchFilesByUser(search);
      setFiles(data);
      setCategoryCounts(computeCounts(data));
      if (data.length === 0) {
        setStatus(`No documents found for "${search}".`);
      }
    } catch (error) {
      console.error('Search failed', error);
      setStatus('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (file: FileRecord) => {
    try {
      await viewFile(file.id, CURRENT_USER.id, CURRENT_USER.fullName, CURRENT_USER.username);
      const fileUrl = `${UPLOADS_BASE_URL}/${file.storedName}`;
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('View failed', error);
      setStatus('Unable to record view activity or open file.');
    }
  };

  const handleDelete = async (file: FileRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${file.originalName}"?`)) return;

    try {
      await deleteFile(file.id, CURRENT_USER.id, CURRENT_USER.fullName, CURRENT_USER.username);
      setStatus(`Deleted ${file.originalName}`);
      await fetchFiles();
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
    if (!editingId) return;
    
    try {
      await updateFile(editingId, {
        originalName: editName,
        categoryId: editCategory,
        userId: CURRENT_USER.id,
        fullName: CURRENT_USER.fullName,
        username: CURRENT_USER.username
      });
      setEditingId(null);
      setStatus('Document updated successfully.');
      await fetchFiles();
    } catch (error) {
      console.error('Update failed', error);
      setStatus('Failed to update document.');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="primary-button">Search</button>
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
                      <td className="font-medium">{file.originalName}</td>
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
