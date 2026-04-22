import React, { useState } from 'react'
import UploadForm from './components/UploadForm'
import FileList from './components/FileList'
import ActivityLogs from './components/ActivityLogs'
import { CURRENT_USER } from './config'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>City Health DMS</h1>
        <div className="user-profile">
          <span className="badge badge-info">{CURRENT_USER.fullName}</span>
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
      </nav>
      <main className="app-main">
        {activeTab === 'dashboard' && <FileList />}
        {activeTab === 'upload' && <UploadForm />}
        {activeTab === 'logs' && <ActivityLogs />}
      </main>
    </div>
  )
}

export default App
