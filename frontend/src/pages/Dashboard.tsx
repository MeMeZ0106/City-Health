import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import FileList from '../components/FileList';
import ActivityLogs from '../components/ActivityLogs';
import UserProfile from '../components/UserProfile';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>City Health DMS</h1>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <span className="badge badge-info">{user?.fullName}</span>
          </div>
          <ThemeToggle />
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>
      <nav className="app-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          Upload Document
        </button>
        <button
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Activity Logs
        </button>
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          My Profile
        </button>
      </nav>
      <main className="app-main">
        {activeTab === 'dashboard' && <FileList />}
        {activeTab === 'upload' && <UploadForm />}
        {activeTab === 'logs' && <ActivityLogs />}
        {activeTab === 'profile' && <UserProfile />}
      </main>
    </div>
  );
};

export default Dashboard;
