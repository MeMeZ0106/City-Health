import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { 
  getProvinces, 
  getCitiesAndMunicipalities, 
  getBarangays,
  Province,
  CityMun,
  Barangay
} from '../utils/locationService';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AdminDashboard: React.FC = () => {
  const { user, getUsers, adminUpdateUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  
  // Location States for Edit
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [cities, setCities] = useState<CityMun[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    }
  }, [getUsers]);

  const fetchAdminLogs = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs/admin`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        }
      });
      setAdminLogs(response.data);
    } catch (err: any) {
      console.error('Failed to fetch admin logs', err);
    }
  }, [token, user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchAdminLogs()]);
      const provData = await getProvinces();
      setProvinces(provData);
      setLoading(false);
    };

    init();
  }, [fetchUsers, fetchAdminLogs]);

  useEffect(() => {
    const fetchCities = async () => {
      if (selectedProvince) {
        const data = await getCitiesAndMunicipalities(selectedProvince);
        setCities(data);
      }
    };
    fetchCities();
  }, [selectedProvince]);

  useEffect(() => {
    const fetchBarangays = async () => {
      if (selectedCity) {
        const data = await getBarangays(selectedCity);
        setBarangays(data);
      }
    };
    fetchBarangays();
  }, [selectedCity]);

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPhone(u.phoneNumber);
    setEditAddress(u.address);
    
    const prov = provinces.find(p => p.name === u.province);
    if (prov) setSelectedProvince(prov.code);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setError('');
    setSuccess('');

    const provinceName = provinces.find(p => p.code === selectedProvince)?.name || editingUser.province;
    const cityName = cities.find(c => c.code === selectedCity)?.name || editingUser.cityMun;
    const barangayName = barangays.find(b => b.code === selectedBarangay)?.name || editingUser.barangay;

    try {
      await adminUpdateUser(editingUser.id, {
        fullName: editFullName,
        phoneNumber: editPhone,
        address: editAddress,
        province: provinceName,
        cityMun: cityName,
        barangay: barangayName
      });
      setSuccess(`Updated user ${editingUser.username} successfully`);
      setEditingUser(null);
      await Promise.all([fetchUsers(), fetchAdminLogs()]);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="app-nav" style={{ marginBottom: '1rem', background: 'none', padding: 0 }}>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>User Management</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Admin Activity Logs</button>
      </nav>

      <main>
        {activeTab === 'users' && (
          <>
            <div className="section-header">
              <h2>Registered Accounts</h2>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="table-responsive">
              {loading ? (
                <div className="loader">Loading users...</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th>Role</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="font-medium">{u.fullName}</td>
                        <td>@{u.username}</td>
                        <td>{u.phoneNumber}</td>
                        <td>{u.barangay}, {u.cityMun}, {u.province}</td>
                        <td>
                          <span className={`badge ${u.isAdmin ? 'badge-danger' : 'badge-info'}`}>
                            {u.isAdmin ? 'ADMIN' : 'USER'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button className="view-button" onClick={() => handleStartEdit(u)}>Edit Info</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === 'logs' && (
          <>
            <div className="section-header">
              <h2>Administrative Actions</h2>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Action Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-medium">{log.user.fullName} (@{log.user.username})</td>
                      <td>{log.action}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {adminLogs.length === 0 && (
                    <tr><td colSpan={3} className="text-center">No admin actions recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Admin Edit Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="upload-card" style={{ maxWidth: '600px', width: '90%' }}>
            <h3 style={{ marginBottom: '1.5rem', textTransform: 'uppercase', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem' }}>
              Edit Account: {editingUser.username} {editingUser.id === user?.id ? '(YOU)' : ''}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Street Address</label>
              <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Province</label>
                <select value={selectedProvince} onChange={(e) => { setSelectedProvince(e.target.value); setSelectedCity(''); setSelectedBarangay(''); }}>
                  <option value="">{editingUser.province}</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>City/Mun</label>
                <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedBarangay(''); }}>
                  <option value="">{editingUser.cityMun}</option>
                  {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Barangay</label>
                <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)}>
                  <option value="">{editingUser.barangay}</option>
                  {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-prominent" style={{ flex: 1 }} onClick={handleSaveEdit}>Save Changes</button>
              <button className="secondary-button" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
