import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import { Users, FileText, BarChart3, Download, Database, AlertCircle, TrendingUp, Clock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function DashboardAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [healthCheck, setHealthCheck] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      alert('Akses ditolak. Halaman ini hanya untuk admin.');
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load system overview
      const statsResponse = await fetch(`${API_BASE_URL}/admin/system-overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Load health check
      const healthResponse = await fetch(`${API_BASE_URL}/admin/health-check`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthCheck(healthData.data);
      }

      // Load recent activity (last 30 days)
      const activityResponse = await fetch(`${API_BASE_URL}/admin/quiz-activity?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.data);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/export/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Convert to CSV
        const csvContent = convertToCSV(data.data, type);
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        alert(`Data ${type} berhasil diekspor!`);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Gagal mengekspor data');
    }
  };

  const convertToCSV = (data, type) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => {
      return Object.values(row).map(val => {
        // Handle nilai yang mengandung koma
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      }).join(',');
    });
    
    return [headers, ...rows].join('\n');
  };

  const handleBackup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/backup-info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Backup Info:\n\nDatabase: ${data.data.database_name}\nTotal Users: ${data.data.total_users}\nTotal Soal: ${data.data.total_soal}\nTotal Quiz: ${data.data.total_hasil_quiz}\n\nSilakan lakukan backup manual melalui phpMyAdmin atau MySQL CLI.`);
      }
    } catch (error) {
      console.error('Error getting backup info:', error);
      alert('Gagal mendapatkan informasi backup');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
          <p className="text-gray-600">Monitoring dan manajemen sistem Quiz Master</p>
        </div>

        {/* System Health Alert */}
        {healthCheck && healthCheck.some(h => h.status !== 'OK') && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Peringatan Sistem</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {healthCheck.filter(h => h.status !== 'OK').map((h, idx) => (
                    <div key={idx}>• {h.check_type}: {h.count} items memerlukan perhatian</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Admin */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Admin</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.overview?.total_admin || 0}</p>
          </div>

          {/* Total Kreator */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Kreator</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.overview?.total_kreator || 0}</p>
          </div>

          {/* Total Soal */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Soal</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.overview?.total_soal || 0}</p>
          </div>

          {/* Total Quiz Completed */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Quiz Selesai</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.overview?.total_quiz_completed || 0}</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Kategori</h3>
            <p className="text-2xl font-bold text-gray-900">{stats?.overview?.total_kategori || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Kumpulan Soal</h3>
            <p className="text-2xl font-bold text-gray-900">{stats?.overview?.total_kumpulan_soal || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Peserta Unik</h3>
            <p className="text-2xl font-bold text-gray-900">{stats?.overview?.total_unique_peserta || 0}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Export Data */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <Download className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">Download data dalam format CSV</p>
            <div className="space-y-2">
              <button
                onClick={() => handleExportData('users')}
                className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Export Data Users
              </button>
              <button
                onClick={() => handleExportData('hasil-quiz')}
                className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                Export Hasil Quiz
              </button>
              <button
                onClick={() => handleExportData('soal')}
                className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                Export Data Soal
              </button>
            </div>
          </div>

          {/* Backup & Maintenance */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <Database className="h-5 w-5 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Backup & Maintenance</h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">Kelola database dan sistem</p>
            <div className="space-y-2">
              <button
                onClick={handleBackup}
                className="w-full px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
              >
                Info Backup Database
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
              >
                Kelola Users
              </button>
              <button
                onClick={loadDashboardData}
                className="w-full px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
          </div>
          
          {recentActivity && recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kumpulan Soal</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kreator</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Peserta</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Avg Score</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{item.kumpulan_soal_judul}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.created_by_name}</td>
                      <td className="py-3 px-4 text-sm text-center text-gray-900">{item.total_peserta || 0}</td>
                      <td className="py-3 px-4 text-sm text-center text-gray-900">
                        {item.rata_rata_skor ? Math.round(item.rata_rata_skor) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Belum ada aktivitas</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DashboardAdmin;
