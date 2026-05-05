import React, { useEffect, useState, useCallback } from 'react';
import { getFiles, searchFilesByUser, viewFile, deleteFile, updateFile, getCategories, searchFiles } from '../api/fileApi';
import { useAuth } from '../contexts/AuthContext';
import { UPLOADS_BASE_URL } from '../config';
import type { FileRecord, Category } from '../types';

const FileList: React.FC = () => {
  const { token } = useAuth();
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
  const [viewingUploader, setViewingUploader] = useState<any>(null);

  // Advanced Search State
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState({
    fileName: '',
    categoryId: '',
    uploaderName: '',
    uploaderUsername: '',
    startDate: '',
    endDate: '',
  });

  const computeCounts = useCallback((data: FileRecord[]) => {
    return data.reduce((counts, file) => {
      counts[file.category.name] = (counts[file.category.name] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setStatus('');
    try {
      const [filesData, catsData] = await Promise.all([getFiles(token), getCategories()]);
      setFiles(filesData);
      setCategories(catsData);
      setCategoryCounts(computeCounts(filesData));
    } catch (error) {
      console.error('Failed to fetch files', error);
      setStatus('Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }, [token, computeCounts]);

  const handleSearch = async () => {
    if (!token) return;
    
    // Check if any advanced filters are set
    const hasAdvancedFilters = Object.values(searchFilters).some(value => value.trim() !== '');
    
    if (!search.trim() && !hasAdvancedFilters) {
      await fetchFiles();
      return;
    }

    setLoading(true);
    setStatus('');
    try {
      let data: FileRecord[];
      
      if (hasAdvancedFilters) {
        // Use advanced search
        const params: any = {};
        if (searchFilters.fileName) params.fileName = searchFilters.fileName;
        if (searchFilters.categoryId) params.categoryId = parseInt(searchFilters.categoryId);
        if (searchFilters.uploaderName) params.uploaderName = searchFilters.uploaderName;
        if (searchFilters.uploaderUsername) params.uploaderUsername = searchFilters.uploaderUsername;
        if (searchFilters.startDate) params.startDate = searchFilters.startDate;
        if (searchFilters.endDate) params.endDate = searchFilters.endDate;
        
        data = await searchFiles(params, token);
      } else {
        // Use legacy search by uploader name
        data = await searchFilesByUser(search, token);
      }
      
      setFiles(data);
      setCategoryCounts(computeCounts(data));
      if (data.length === 0) {
        setStatus(`No documents found matching the search criteria.`);
      }
    } catch (error) {
      console.error('Search failed', error);
      setStatus('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setSearchFilters({
      fileName: '',
      categoryId: '',
      uploaderName: '',
      uploaderUsername: '',
      startDate: '',
      endDate: '',
    });
    fetchFiles();
  };

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
    if (!token || !editingId) return;
    
    try {
      await updateFile(editingId, {
        originalName: editName,
        categoryId: editCategory,
      }, token);
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
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Quick search by uploader name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn-prominent">Search</button>
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} 
              className="btn-secondary"
            >
              {showAdvancedSearch ? 'Hide' : 'Show'} Advanced Search
            </button>
            {(search.trim() || Object.values(searchFilters).some(v => v.trim())) && (
              <button onClick={clearSearch} className="btn-secondary">Clear</button>
            )}
          </div>

          {showAdvancedSearch && (
            <div className="advanced-search">
              <div className="search-grid">
                <div className="search-field">
                  <label>File Name:</label>
                  <input
                    type="text"
                    value={searchFilters.fileName}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, fileName: e.target.value }))}
                    placeholder="Search by file name"
                  />
                </div>
                <div className="search-field">
                  <label>Category:</label>
                  <select
                    value={searchFilters.categoryId}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="search-field">
                  <label>Uploader Name:</label>
                  <input
                    type="text"
                    value={searchFilters.uploaderName}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, uploaderName: e.target.value }))}
                    placeholder="Search by uploader full name"
                  />
                </div>
                <div className="search-field">
                  <label>Uploader Username:</label>
                  <input
                    type="text"
                    value={searchFilters.uploaderUsername}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, uploaderUsername: e.target.value }))}
                    placeholder="Search by uploader username"
                  />
                </div>
                <div className="search-field">
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={searchFilters.startDate}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="search-field">
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={searchFilters.endDate}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <button onClick={handleSearch} className="btn-prominent" style={{ marginTop: '1rem' }}>
                Apply Advanced Search
              </button>
            </div>
          )}
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
                      <td>
                        <button 
                          onClick={() => setViewingUploader(file.uploadedBy)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit'
                          }}
                          title="View uploader contact info"
                        >
                          {file.uploadedBy.fullName}
                        </button>
                      </td>
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

      {/* Uploader Info Modal */}
      {viewingUploader && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Uploader Information
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{viewingUploader.fullName}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Username</label>
                  <div>@{viewingUploader.username}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                  <div>{viewingUploader.phoneNumber || 'N/A'}</div>
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Address</label>
                <div>{viewingUploader.address || 'N/A'}</div>
              </div>
              
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location</label>
                <div>
                  {viewingUploader.barangay ? `${viewingUploader.barangay}, ` : ''}
                  {viewingUploader.cityMun ? `${viewingUploader.cityMun}, ` : ''}
                  {viewingUploader.province || 'N/A'}
                </div>
              </div>
            </div>
            
            <button 
              className="btn-prominent" 
              style={{ width: '100%', marginTop: '2rem' }}
              onClick={() => setViewingUploader(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
