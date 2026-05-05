import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getProvinces, 
  getCitiesAndMunicipalities, 
  getBarangays,
  Province,
  CityMun,
  Barangay
} from '../utils/locationService';

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  
  // Location States
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [cities, setCities] = useState<CityMun[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProvinces = async () => {
      const data = await getProvinces();
      setProvinces(data);
      
      // If user has a province, try to find its code
      if (user?.province) {
        const province = data.find(p => p.name === user.province);
        if (province) {
          setSelectedProvince(province.code);
        }
      }
    };
    fetchProvinces();
  }, [user?.province]);

  useEffect(() => {
    const fetchCities = async () => {
      if (selectedProvince) {
        const data = await getCitiesAndMunicipalities(selectedProvince);
        setCities(data);
        
        // If user has a city and we just loaded this province, try to find city code
        if (user?.cityMun && !selectedCity) {
          const city = data.find(c => c.name === user.cityMun);
          if (city) {
            setSelectedCity(city.code);
          }
        }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [selectedProvince, user?.cityMun, selectedCity]);

  useEffect(() => {
    const fetchBarangays = async () => {
      if (selectedCity) {
        const data = await getBarangays(selectedCity);
        setBarangays(data);
        
        // If user has a barangay and we just loaded this city, try to find barangay code
        if (user?.barangay && !selectedBarangay) {
          const brgy = data.find(b => b.name === user.barangay);
          if (brgy) {
            setSelectedBarangay(brgy.code);
          }
        }
      } else {
        setBarangays([]);
      }
    };
    fetchBarangays();
  }, [selectedCity, user?.barangay, selectedBarangay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: '', type: null });

    if (!selectedProvince || !selectedCity || !selectedBarangay) {
      setStatus({ message: 'Please complete your location information', type: 'error' });
      return;
    }

    setLoading(true);

    const provinceName = provinces.find(p => p.code === selectedProvince)?.name || '';
    const cityName = cities.find(c => c.code === selectedCity)?.name || '';
    const barangayName = barangays.find(b => b.code === selectedBarangay)?.name || '';

    try {
      await updateProfile({
        fullName,
        phoneNumber,
        address,
        province: provinceName,
        cityMun: cityName,
        barangay: barangayName
      });
      setStatus({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setStatus({ message: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>My Profile</h2>
      </div>

      <div className="upload-card">
        {status.message && (
          <div className={`alert alert-${status.type} mb-1`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Email (Account ID)</label>
              <input type="text" value={user?.email} disabled style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={user?.username} disabled style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.7 }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Actual Address (House No, Street, etc.)</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="location-section" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Location Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="province">Province</label>
                <select
                  id="province"
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedCity('');
                    setSelectedBarangay('');
                  }}
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">City/Municipality</label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedBarangay('');
                  }}
                  required
                  disabled={!selectedProvince}
                >
                  <option value="">Select City</option>
                  {cities.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="barangay">Barangay</label>
                <select
                  id="barangay"
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  required
                  disabled={!selectedCity}
                >
                  <option value="">Select Barangay</option>
                  {barangays.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-prominent" style={{ width: '100%', padding: '1rem' }}>
            {loading ? 'Saving Changes...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
