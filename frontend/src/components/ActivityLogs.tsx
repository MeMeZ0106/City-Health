import React, { useEffect, useState, useCallback } from 'react';
import { getLogs, searchLogs } from '../api/fileApi';
import { useAuth } from '../contexts/AuthContext';
import type { ActivityLog } from '../types';

const ActivityLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');

  // Search State
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState({
    userName: '',
    action: '',
    fileName: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getLogs(token);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
      setStatus('Unable to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSearch = async () => {
    if (!token) return;
    
    const hasFilters = Object.values(searchFilters).some(value => value.trim() !== '');
    
    if (!hasFilters) {
      await fetchLogs();
      return;
    }

    setLoading(true);
    setStatus('');
    try {
      const params: any = {};
      if (searchFilters.userName) params.userName = searchFilters.userName;
      if (searchFilters.action) params.action = searchFilters.action;
      if (searchFilters.fileName) params.fileName = searchFilters.fileName;
      if (searchFilters.startDate) params.startDate = searchFilters.startDate;
      if (searchFilters.endDate) params.endDate = searchFilters.endDate;
      
      const data = await searchLogs(params, token);
      setLogs(data);
      if (data.length === 0) {
        setStatus('No activity logs found matching the search criteria.');
      }
    } catch (error) {
      console.error('Search failed', error);
      setStatus('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchFilters({
      userName: '',
      action: '',
      fileName: '',
      startDate: '',
      endDate: '',
    });
    fetchLogs();
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionClass = (action: string) => {
    switch (action) {
      case 'UPLOAD': return 'badge-success';
      case 'VIEW': return 'badge-info';
      case 'DELETE': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="logs-container">
      <div className="section-header">
        <h2>Activity Audit Logs</h2>
        <div className="search-container">
          <button onClick={fetchLogs} className="secondary-button" disabled={loading}>
            Refresh Logs
          </button>
          <button 
            onClick={() => setShowSearch(!showSearch)} 
            className="btn-secondary"
          >
            {showSearch ? 'Hide' : 'Show'} Search Filters
          </button>
          {Object.values(searchFilters).some(v => v.trim()) && (
            <button onClick={clearSearch} className="btn-secondary">Clear Filters</button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="advanced-search" style={{ marginBottom: '1rem' }}>
          <div className="search-grid">
            <div className="search-field">
              <label>User Name:</label>
              <input
                type="text"
                value={searchFilters.userName}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="Search by user name"
              />
            </div>
            <div className="search-field">
              <label>Action:</label>
              <input
                type="text"
                value={searchFilters.action}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, action: e.target.value }))}
                placeholder="e.g., UPLOAD, VIEW, DELETE"
              />
            </div>
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
            Apply Search Filters
          </button>
        </div>
      )}

      {status && <div className="alert alert-error">{status}</div>}

      <div className="table-responsive">
        {loading ? (
          <div className="loader">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">No activity recorded yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Document Name</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="font-medium">{log.user.fullName}</td>
                  <td>
                    <span className={`badge ${getActionClass(log.action)}`}>
                      {log.action.includes(':') ? log.action.split(':')[0] : log.action}
                    </span>
                  </td>
                  <td>
                    {log.file ? (
                      <span className="file-link">{log.file.originalName}</span>
                    ) : log.action.startsWith('ADMIN_') ? (
                      <span className="text-muted italic">System Account Change</span>
                    ) : (
                      <span className="text-muted italic">[Deleted Document]</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
