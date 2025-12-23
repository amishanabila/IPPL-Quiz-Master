import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderAdmin from '../header/HeaderAdmin';
import Footer from '../footer/Footer';
import { ArrowLeft, Users, Edit2, Trash2, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function KelolaUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      alert('Akses ditolak. Halaman ini hanya untuk admin.');
      navigate('/admin/dashboard');
      return;
    }

    loadUsers();
  }, [navigate]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterRole, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.warn('⚠️ No auth token found');
        alert('Sesi anda telah berakhir, silakan login kembali');
        navigate('/admin');
        return;
      }
      
      console.log('🔑 Loading users with token:', token ? 'Token exists' : 'No token');
      
      const apiUrl = `${API_BASE_URL}/admin/users`;
      console.log('🌐 Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Users response status:', response.status);
      console.log('📊 Users response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Users load error:', errorData);
          alert(`Gagal memuat data users (${response.status}): ${errorData.message || 'Unknown error'}`);
        } catch (e) {
          console.error('❌ Error parsing response:', errorText);
          alert(`Gagal memuat data users: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();
      console.log('✅ Users data loaded:', data);
      
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
        console.log(`✅ Set ${data.data.length} users`);
      } else if (Array.isArray(data)) {
        setUsers(data);
        console.log(`✅ Set ${data.length} users (direct array)`);
      } else {
        console.warn('⚠️ Unexpected response structure:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Terjadi kesalahan saat memuat data users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.nama?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`Apakah Anda yakin ingin mengubah role user ini menjadi ${newRole}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/users/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, newRole })
      });

      if (response.ok) {
        alert('Role user berhasil diupdate!');
        setEditingUser(null);
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal update role user');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Terjadi kesalahan saat update role');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${username}"? Tindakan ini tidak dapat dibatalkan!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('User berhasil dihapus!');
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal menghapus user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Terjadi kesalahan saat menghapus user');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'kreator':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'peserta':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data users...</p>
          <p className="text-sm text-gray-400 mt-2">Menghubungkan ke backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderAdmin />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </button>
          <div className="flex items-center mb-2">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Kelola Users</h1>
          </div>
          <p className="text-gray-600">Manajemen user dan role</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari username atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="kreator">Kreator</option>
              <option value="peserta">Peserta</option>
            </select>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Menampilkan {filteredUsers.length} dari {users.length} users
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Username</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Total Quiz</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Total Soal</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id || `peserta-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{user.nama}</div>
                        <div className="text-xs text-gray-500">
                          {user.id ? `ID: ${user.id}` : 'Peserta (via PIN)'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-700">{user.email || '-'}</td>
                      <td className="py-4 px-6">
                        {editingUser === user.id && user.id ? (
                          <select
                            defaultValue={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="kreator">Kreator</option>
                            <option value="peserta">Peserta</option>
                          </select>
                        ) : (
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700">
                        {user.total_kumpulan_soal || 0}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700">
                        {user.role === 'peserta' ? '-' : (user.total_kumpulan_soal || 0)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {user.id ? (
                            <>
                              <button
                                onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit role"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.nama)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Read-only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500">
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium mb-1">Total Admin</div>
            <div className="text-2xl font-bold text-red-900">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Kreator</div>
            <div className="text-2xl font-bold text-blue-900">
              {users.filter(u => u.role === 'kreator').length}
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Total Peserta</div>
            <div className="text-2xl font-bold text-green-900">
              {users.filter(u => u.role === 'peserta').length}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default KelolaUsers;
