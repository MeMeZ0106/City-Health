import React, { useEffect, useState, useCallback } from 'react';
import { getLogs } from '../api/fileApi';
import type { ActivityLog } from '../types';

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
      setStatus('Unable to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, []);

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
        <button onClick={fetchLogs} className="secondary-button" disabled={loading}>
          Refresh Logs
        </button>
      </div>

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
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {log.file ? (
                      <span className="file-link">{log.file.originalName}</span>
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
