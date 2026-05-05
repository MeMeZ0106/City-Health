import React, { useState } from 'react'
import UploadForm from './components/UploadForm'
import FileList from './components/FileList'
import ActivityLogs from './components/ActivityLogs'
import AdminDashboard from './components/AdminDashboard'
import { useAuth } from './contexts/AuthContext'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { user, loading, login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>City Health DMS</h1>
          <h2>Login</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email or Username</label>
              <input 
                type="text" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn-prominent">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>City Health DMS</h1>
        <div className="header-right">
          <div className="user-profile">
            <span className="badge badge-info">{user.fullName}</span>
          </div>
          <button onClick={logout} className="btn-logout">Logout</button>
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
        {user.isAdmin && (
          <button 
            className={activeTab === 'admin' ? 'active' : ''} 
            onClick={() => setActiveTab('admin')}
          >
            Admin Dashboard
          </button>
        )}
      </nav>
      <main className="app-main">
        {activeTab === 'dashboard' && <FileList />}
        {activeTab === 'upload' && <UploadForm />}
        {activeTab === 'logs' && <ActivityLogs />}
        {activeTab === 'admin' && user.isAdmin && <AdminDashboard />}
      </main>
    </div>
  )
}

export default App
