import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Building,
  FileText,
  MapPin,
  LogOut,
  Edit2,
  Camera,
  Save,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import config from '@/config/config';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: { firstName: '', lastName: '' },
    mobile: '',
    companyName: '',
    gstNumber: '',
    companyAddress: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch profile from API
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No authentication token found');

      const res = await fetch(config.apiRoutes.user.profile, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (res.status === 401) {
        // Try refresh
        const refreshed = await refreshToken();
        if (refreshed) return fetchProfile();
        throw new Error('Unauthorized. Please login again.');
      }

      if (!res.ok) throw new Error('Failed to fetch profile');

      const data = await res.json();
      setUser(data.user);
      setEditData({
        fullName: {
          firstName: data.user.fullName?.firstName || '',
          lastName: data.user.fullName?.lastName || '',
        },
        mobile: data.user.mobile || '',
        companyName: data.user.companyName || '',
        gstNumber: data.user.gstNumber || '',
        companyAddress: data.user.companyAddress || '',
      });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const res = await fetch(config.apiRoutes.auth.refresh, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Token refresh failed');
      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch (err) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return false;
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(config.apiRoutes.user.updateProfile, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editData),
      });

      if (res.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) return handleUpdateProfile();
        throw new Error('Unauthorized. Please login again.');
      }

      if (!res.ok) throw new Error('Failed to update profile');

      const data = await res.json();
      setUser(data.user);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch(config.apiRoutes.auth.logout, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'fpo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'buyer':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'farmer':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user?.fullName?.firstName?.[0]?.toUpperCase() ||
                    user?.username?.[0]?.toUpperCase() ||
                    'U'}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Camera size={14} className="text-gray-600" />
                </button>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {user?.fullName?.firstName} {user?.fullName?.lastName}
              </h2>
              <p className="text-gray-600 mb-3">@{user?.username}</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                  user?.role
                )}`}
              >
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.fullName.firstName}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              fullName: { ...editData.fullName, firstName: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="py-2 text-gray-900">{user?.fullName?.firstName || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.fullName.lastName}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              fullName: { ...editData.fullName, lastName: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="py-2 text-gray-900">{user?.fullName?.lastName || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Phone size={18} className="text-green-600" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="flex items-center gap-2 py-2">
                        <Mail size={16} className="text-gray-400" />
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.mobile}
                          onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-2 py-2">
                          <Phone size={16} className="text-gray-400" />
                          <p className="text-gray-900">{user?.mobile}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                {(user?.role === 'buyer' || user?.role === 'fpo' || user?.companyName) && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Building size={18} className="text-purple-600" />
                      Company Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.companyName}
                            onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="py-2 text-gray-900">{user?.companyName || 'Not provided'}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.gstNumber}
                              onChange={(e) => setEditData({ ...editData, gstNumber: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="flex items-center gap-2 py-2">
                              <FileText size={16} className="text-gray-400" />
                              <p className="text-gray-900">{user?.gstNumber || 'Not provided'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                        {isEditing ? (
                          <textarea
                            value={editData.companyAddress}
                            onChange={(e) => setEditData({ ...editData, companyAddress: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <div className="flex items-start gap-2 py-2">
                            <MapPin size={16} className="text-gray-400 mt-1" />
                            <p className="text-gray-900">{user?.companyAddress || 'Not provided'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {isEditing && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
