import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import HeaderAdmin from '../header/HeaderAdmin';
import Footer from '../footer/Footer';
import { Users, FileText, BarChart3, Download, Database, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function DashboardAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [healthCheck, setHealthCheck] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [exportPopup, setExportPopup] = useState({ show: false, message: '', type: '' });
  const [backupPopup, setBackupPopup] = useState({ show: false, type: '', data: null });
  const [kreatorPopup, setKreatorPopup] = useState({ show: false, type: '', data: null, message: '' });

  useEffect(() => {
    // VALIDASI AUTENTIKASI DAN ROLE - HARUS ADA TOKEN DAN ROLE ADMIN
    console.log('🔒 DashboardAdmin - Validasi akses');
    
    // Cek apakah user sudah login
    if (!authService.isAuthenticated()) {
      console.log('❌ DashboardAdmin - User belum login');
      alert('Anda harus login terlebih dahulu');
      navigate('/admin', { replace: true });
      return;
    }

    // Cek token
    const token = authService.getToken();
    if (!token) {
      console.log('❌ DashboardAdmin - Token tidak ditemukan');
      authService.logout();
      alert('Sesi anda telah berakhir, silakan login kembali');
      navigate('/admin', { replace: true });
      return;
    }

    // Cek role harus admin
    const userRole = authService.getUserRole();
    const userData = authService.getCurrentUser();
    const actualRole = userRole || userData?.role;
    
    console.log('👤 DashboardAdmin - User role:', actualRole);
    console.log('👤 DashboardAdmin - User data:', userData);
    
    if (actualRole !== 'admin') {
      console.log('❌ DashboardAdmin - Akses ditolak, bukan admin');
      alert('Akses ditolak. Halaman ini hanya untuk admin.');
      authService.logout();
      navigate('/login', { replace: true });
      return;
    }

    console.log('✅ DashboardAdmin - Validasi berhasil, load data');
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      console.log('🔑 Loading admin dashboard with token:', token ? 'Token exists' : 'No token');

      // Load system overview
      const statsResponse = await fetch(`${API_BASE_URL}/admin/system-overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 System overview response status:', statsResponse.status);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ System overview data:', statsData);
        setStats(statsData.data);
      } else {
        const errorData = await statsResponse.json();
        console.error('❌ System overview error:', errorData);
      }

      // Load health check
      const healthResponse = await fetch(`${API_BASE_URL}/admin/health-check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🏥 Health check response status:', healthResponse.status);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Health check data:', healthData);
        setHealthCheck(healthData.data);
      } else {
        const errorData = await healthResponse.json();
        console.error('❌ Health check error:', errorData);
      }

      // Load recent activity (last 30 days)
      const activityResponse = await fetch(`${API_BASE_URL}/admin/quiz-activity?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📈 Activity response status:', activityResponse.status);
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        console.log('✅ Activity data:', activityData);
        setRecentActivity(activityData.data);
      } else {
        const errorData = await activityResponse.json();
        console.error('❌ Activity error:', errorData);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/export/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Process data untuk format yang lebih baik
        const processedData = data.data.map(row => {
          const newRow = { ...row };
          
          // Format variasi_jawaban untuk soal (jika ada)
          if (type === 'soal' && newRow.variasi_jawaban) {
            try {
              const parsedValue = typeof newRow.variasi_jawaban === 'string' 
                ? JSON.parse(newRow.variasi_jawaban) 
                : newRow.variasi_jawaban;
              
              if (Array.isArray(parsedValue)) {
                newRow.variasi_jawaban = parsedValue.join(', ');
              }
            } catch (e) {
              // Keep original if parsing fails
            }
          }
          
          // Format timestamps
          ['created_at', 'updated_at', 'completed_at'].forEach(field => {
            if (newRow[field]) {
              try {
                const date = new Date(newRow[field]);
                if (!isNaN(date.getTime())) {
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  newRow[field] = `${day}/${month}/${year} ${hours}:${minutes}`;
                }
              } catch (e) {
                // Keep original
              }
            }
          });
          
          return newRow;
        });
        
        // Convert to Excel using XLSX
        const worksheet = XLSX.utils.json_to_sheet(processedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
        
        // Auto-size columns
        const maxWidth = 50;
        const cols = [];
        if (processedData.length > 0) {
          Object.keys(processedData[0]).forEach(key => {
            const maxLen = Math.max(
              key.length,
              ...processedData.map(row => String(row[key] || '').length)
            );
            cols.push({ wch: Math.min(maxLen + 2, maxWidth) });
          });
          worksheet['!cols'] = cols;
        }
        
        // Generate Excel file and download
        const filename = `export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        // Show success popup with color matching button type
        const messages = {
          'users': 'Data users berhasil diekspor!',
          'hasil-quiz': 'Data hasil-quiz berhasil diekspor!',
          'soal': 'Data soal berhasil diekspor!'
        };
        setExportPopup({ 
          show: true, 
          message: messages[type] || `Data ${type} berhasil diekspor!`, 
          type: type 
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setExportPopup({ 
        show: true, 
        message: 'Gagal mengekspor data', 
        type: 'error' 
      });
    }
  };

  const convertToCSV = (data, type) => {
    if (!data || data.length === 0) return '';
    
    // Use SEMICOLON for Excel Indonesia (regional settings)
    // Semicolon is the standard delimiter for Excel in Indonesia/Europe
    const DELIMITER = ';';
    
    // Helper function to escape CSV values
    const escapeCSV = (val) => {
      // Handle NULL, undefined
      if (val === null || val === undefined) return '';
      
      // Convert to string
      let strVal = String(val);
      
      // Format timestamps to readable format (DD/MM/YYYY HH:MM:SS)
      if (strVal.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/) || 
          strVal.includes('GMT') || 
          (strVal.includes('2025') && strVal.includes(':'))) {
        try {
          const date = new Date(strVal);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            strVal = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
          }
        } catch (e) {
          // Keep original if parsing fails
        }
      }
      
      // Escape values that contain delimiter, quotes, or newlines
      if (strVal.includes(DELIMITER) || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
        // Escape double quotes by doubling them
        strVal = strVal.replace(/"/g, '""');
        // Wrap in quotes
        return `"${strVal}"`;
      }
      
      return strVal;
    };
    
    // Create header row with friendly names
    const headerMap = {
      'id': 'ID',
      'nama': 'Nama',
      'email': 'Email',
      'role': 'Role',
      'telepon': 'Telepon',
      'is_verified': 'Terverifikasi',
      'created_at': 'Tanggal Dibuat',
      'updated_at': 'Tanggal Diupdate',
      'hasil_id': 'ID Hasil',
      'nama_peserta': 'Nama Peserta',
      'skor': 'Skor',
      'jawaban_benar': 'Jawaban Benar',
      'total_soal': 'Total Soal',
      'waktu_pengerjaan': 'Waktu (detik)',
      'completed_at': 'Selesai Pada',
      'kumpulan_soal_judul': 'Judul Quiz',
      'pin_code': 'PIN',
      'nama_kategori': 'Kategori',
      'materi': 'Materi',
      'created_by_kreator': 'Dibuat Oleh',
      'soal_id': 'ID Soal',
      'pertanyaan': 'Pertanyaan',
      'pilihan_a': 'Pilihan A',
      'pilihan_b': 'Pilihan B',
      'pilihan_c': 'Pilihan C',
      'pilihan_d': 'Pilihan D',
      'jawaban_benar': 'Jawaban Benar',
      'variasi_jawaban': 'Variasi Jawaban'
    };
    
    const keys = Object.keys(data[0]);
    const headers = keys.map(key => headerMap[key] || key).join(DELIMITER);
    const rows = data.map(row => {
      return Object.values(row).map(escapeCSV).join(DELIMITER);
    });
    
    // Add UTF-8 BOM for proper Excel encoding
    // BOM + semicolon delimiter = Excel Indonesia akan auto-parse dengan benar
    const BOM = '\uFEFF';
    const csvData = [headers, ...rows].join('\r\n');
    
    return BOM + csvData;
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/backup-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackupPopup({ show: true, type: 'choice', data: data.data });
      } else {
        setBackupPopup({ show: true, type: 'error', data: null });
      }
    } catch (error) {
      console.error('Error getting backup info:', error);
      setBackupPopup({ show: true, type: 'error', data: null });
    }
  };

  const handleBackupChoice = (choice) => {
    const info = backupPopup.data;
    
    if (choice === 'download') {
      // Create Excel workbook
      const backupData = [
        { Field: 'Database Name', Value: info.database_name },
        { Field: 'Total Users', Value: info.total_users },
        { Field: 'Total Soal', Value: info.total_soal },
        { Field: 'Total Hasil Quiz', Value: info.total_hasil_quiz },
        { Field: 'Generated', Value: new Date().toLocaleString('id-ID') },
        { Field: 'Note', Value: 'Untuk full database backup, gunakan phpMyAdmin atau MySQL CLI' }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(backupData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Backup Info');
      
      // Download Excel
      const filename = `backup_info_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      setBackupPopup({ show: true, type: 'success', data: info });
    } else {
      // Show info
      setBackupPopup({ show: true, type: 'info', data: info });
    }
  };

  const handleCheckOrphanedData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/orphaned-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const orphanedData = result.data;
        
        if (!orphanedData || orphanedData.length === 0) {
          setKreatorPopup({
            show: true,
            type: 'check-success',
            data: null,
            message: 'Semua data (kumpulan soal, kategori, materi) sudah memiliki kreator yang valid.'
          });
        } else {
          // Group by table_name
          const grouped = orphanedData.reduce((acc, item) => {
            if (!acc[item.table_name]) acc[item.table_name] = [];
            acc[item.table_name].push(item);
            return acc;
          }, {});
          
          setKreatorPopup({
            show: true,
            type: 'check-found',
            data: { orphanedData, grouped, total: orphanedData.length },
            message: ''
          });
        }
      } else {
        throw new Error('Failed to check orphaned data');
      }
    } catch (error) {
      console.error('Error checking orphaned data:', error);
      setKreatorPopup({
        show: true,
        type: 'error',
        data: null,
        message: 'Gagal mengecek orphaned data. Silakan coba lagi.'
      });
    }
  };

  const handleFixMissingCreators = async () => {
    // Show confirmation popup
    setKreatorPopup({
      show: true,
      type: 'fix-confirm',
      data: null,
      message: ''
    });
  };

  const handleFixMissingCreatorsConfirmed = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/fix-missing-creators`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        
        if (data && data.kumpulan_soal_updated !== undefined) {
          setKreatorPopup({
            show: true,
            type: 'fix-success',
            data: data,
            message: result.message
          });
        } else if (data && data.message) {
          setKreatorPopup({
            show: true,
            type: 'fix-warning',
            data: data,
            message: data.message
          });
        } else {
          setKreatorPopup({
            show: true,
            type: 'fix-success',
            data: null,
            message: result.message
          });
        }
        
        // Refresh dashboard data
        loadDashboardData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fix missing creators');
      }
    } catch (error) {
      console.error('Error fixing missing creators:', error);
      setKreatorPopup({
        show: true,
        type: 'error',
        data: null,
        message: `Gagal memperbaiki data: ${error.message}`
      });
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
      <HeaderAdmin />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
          <p className="text-gray-600">Monitoring dan manajemen sistem Quiz Master</p>
        </div>

        {/* System Health Alert */}
        {healthCheck && healthCheck.some(h => h.status === 'WARNING') && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Peringatan Sistem</h3>
                <div className="mt-2 text-sm text-yellow-700 space-y-1">
                  {healthCheck.filter(h => h.status === 'WARNING').map((h, idx) => (
                    <div key={idx}>• <strong>{h.check_type}</strong>: {h.count} item memerlukan perhatian</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* System Health Info (non-critical) */}
        {healthCheck && healthCheck.some(h => h.status === 'INFO' && h.count > 0) && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-400 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Informasi Sistem</h3>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  {healthCheck.filter(h => h.status === 'INFO' && h.count > 0).map((h, idx) => (
                    <div key={idx}>
                      • <strong>{h.check_type}</strong>: {h.count} item
                      {h.check_type === 'Session Kadaluarsa' && (
                        <span className="ml-1 text-xs">(Session quiz yang melewati batas waktu - normal terjadi)</span>
                      )}
                    </div>
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
            <p className="text-3xl font-bold text-gray-900">{stats?.overview?.total_quiz_selesai || stats?.overview?.total_quiz_completed || 0}</p>
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
            <h3 className="text-gray-600 text-sm font-medium mb-2">Peserta</h3>
            <p className="text-2xl font-bold text-gray-900">{stats?.overview?.total_unique_peserta || stats?.overview?.total_peserta || 0}</p>
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
            <p className="text-gray-600 text-sm mb-4">Download data dalam format Excel (.xlsx)</p>
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
                onClick={handleCheckOrphanedData}
                className="w-full px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
              >
                Cek Data Tanpa Kreator
              </button>
              <button
                onClick={handleFixMissingCreators}
                className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Fix Data Kreator
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

      {/* Custom Export Popup */}
      {exportPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
            {/* Header with matching color */}
            <div className={`p-6 ${
              exportPopup.type === 'users' ? 'bg-blue-50' :
              exportPopup.type === 'hasil-quiz' ? 'bg-green-50' :
              exportPopup.type === 'soal' ? 'bg-purple-50' :
              'bg-red-50'
            }`}>
              <div className="flex items-center justify-center mb-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  exportPopup.type === 'users' ? 'bg-blue-100' :
                  exportPopup.type === 'hasil-quiz' ? 'bg-green-100' :
                  exportPopup.type === 'soal' ? 'bg-purple-100' :
                  'bg-red-100'
                }`}>
                  {exportPopup.type === 'error' ? (
                    <AlertCircle className={`h-8 w-8 text-red-600`} />
                  ) : (
                    <Download className={`h-8 w-8 ${
                      exportPopup.type === 'users' ? 'text-blue-600' :
                      exportPopup.type === 'hasil-quiz' ? 'text-green-600' :
                      'text-purple-600'
                    }`} />
                  )}
                </div>
              </div>
              <h3 className={`text-center text-lg font-semibold ${
                exportPopup.type === 'users' ? 'text-blue-900' :
                exportPopup.type === 'hasil-quiz' ? 'text-green-900' :
                exportPopup.type === 'soal' ? 'text-purple-900' :
                'text-red-900'
              }`}>
                {exportPopup.type === 'error' ? 'Gagal Export' : 'Quiz Master menyatakan'}
              </h3>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 text-center mb-6">
                {exportPopup.message}
              </p>

              {/* Button with matching color */}
              <button
                onClick={() => setExportPopup({ show: false, message: '', type: '' })}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                  exportPopup.type === 'users' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  exportPopup.type === 'hasil-quiz' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  exportPopup.type === 'soal' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                  'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Oke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Popup */}
      {backupPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-fadeIn">
            {/* Header */}
            <div className="p-6 rounded-t-2xl bg-orange-50 border-b border-orange-100">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-orange-100">
                  {backupPopup.type === 'error' ? (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  ) : (
                    <Database className="h-8 w-8 text-orange-600" />
                  )}
                </div>
              </div>
              <h3 className="text-center text-lg font-semibold text-orange-900">
                {backupPopup.type === 'error' ? 'Gagal Backup' :
                 backupPopup.type === 'success' ? '✅ Backup Berhasil' :
                 backupPopup.type === 'info' ? '📊 Backup Info' :
                 '💾 BACKUP DATABASE'}
              </h3>
            </div>

            {/* Body */}
            <div className="p-6">
              {backupPopup.type === 'choice' && (
                <>
                  <div className="mb-6 text-center">
                    <p className="text-gray-700 mb-4 font-medium">Pilih:</p>
                    <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✅</span>
                        <span className="text-gray-700">OK = Download Backup Info (Excel)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600">❌</span>
                        <span className="text-gray-700">Cancel = Lihat Info Saja</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      💡 Note: Untuk full database backup, gunakan phpMyAdmin
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBackupChoice('download')}
                      className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                    >
                      Oke
                    </button>
                    <button
                      onClick={() => handleBackupChoice('view')}
                      className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </>
              )}

              {backupPopup.type === 'info' && backupPopup.data && (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                      <div className="text-sm text-gray-600 mb-1">Database</div>
                      <div className="text-lg font-semibold text-orange-900">{backupPopup.data.database_name}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                        <div className="text-2xl font-bold text-blue-900">{backupPopup.data.total_users}</div>
                        <div className="text-xs text-blue-600">Users</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                        <div className="text-2xl font-bold text-green-900">{backupPopup.data.total_soal}</div>
                        <div className="text-xs text-green-600">Soal</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-center">
                        <div className="text-2xl font-bold text-purple-900">{backupPopup.data.total_hasil_quiz}</div>
                        <div className="text-xs text-purple-600">Quiz</div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">💡 Untuk backup lengkap:</span>
                        <br />- Gunakan phpMyAdmin
                        <br />- Atau MySQL CLI: <code className="bg-yellow-100 px-1 rounded text-xs">mysqldump -u root quiz_master {'>'} backup.sql</code>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBackupPopup({ show: false, type: '', data: null })}
                    className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </>
              )}

              {backupPopup.type === 'success' && backupPopup.data && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <Download className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-gray-700 mb-4">
                      Backup info berhasil didownload!
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg text-left">
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>📊 Database: <span className="font-semibold">{backupPopup.data.database_name}</span></div>
                        <div>👥 Total Users: <span className="font-semibold">{backupPopup.data.total_users}</span></div>
                        <div>📝 Total Soal: <span className="font-semibold">{backupPopup.data.total_soal}</span></div>
                        <div>📊 Total Quiz: <span className="font-semibold">{backupPopup.data.total_hasil_quiz}</span></div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setBackupPopup({ show: false, type: '', data: null })}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </>
              )}

              {backupPopup.type === 'error' && (
                <>
                  <p className="text-gray-700 text-center mb-6">
                    ❌ Gagal mendapatkan informasi backup. Silakan coba lagi.
                  </p>
                  <button
                    onClick={() => setBackupPopup({ show: false, type: '', data: null })}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kreator Popup */}
      {kreatorPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-fadeIn">
            {/* Check Success - Yellow Theme */}
            {kreatorPopup.type === 'check-success' && (
              <>
                <div className="p-6 rounded-t-2xl bg-yellow-50 border-b border-yellow-100">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-semibold text-yellow-900">
                    ✅ Data Integrity Check
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Fungsi Fitur Ini</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p className="mb-2"><strong>Cek Data Tanpa Kreator</strong> adalah fitur untuk mengecek data yang tidak memiliki pembuat (kreator) yang valid.</p>
                          <p className="mb-1">📋 <strong>Yang dicek:</strong></p>
                          <ul className="list-disc list-inside ml-2 space-y-1">
                            <li>Kumpulan Soal tanpa kreator</li>
                            <li>Kategori tanpa kreator</li>
                            <li>Materi tanpa kreator</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg mb-4 text-center">
                    <p className="text-green-800 font-semibold">✅ Tidak ada data orphaned!</p>
                    <p className="text-green-700 text-sm mt-2">{kreatorPopup.message}</p>
                  </div>
                  <button
                    onClick={() => setKreatorPopup({ show: false, type: '', data: null, message: '' })}
                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </div>
              </>
            )}

            {/* Check Found - Yellow Theme */}
            {kreatorPopup.type === 'check-found' && (
              <>
                <div className="p-6 rounded-t-2xl bg-yellow-50 border-b border-yellow-100">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <AlertCircle className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-semibold text-yellow-900">
                    ⚠️ Data Tanpa Kreator Ditemukan
                  </h3>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Fungsi Fitur Ini</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p><strong>Cek Data Tanpa Kreator</strong> membantu mendeteksi data "orphaned" (yatim piatu) yang tidak memiliki pembuat valid untuk menjaga integritas database.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                    <p className="text-orange-800 font-semibold mb-2">
                      📊 Ditemukan {kreatorPopup.data.total} data tanpa kreator:
                    </p>
                    <div className="space-y-3">
                      {Object.entries(kreatorPopup.data.grouped).map(([tableName, items]) => (
                        <div key={tableName} className="bg-white p-3 rounded border border-orange-100">
                          <div className="font-semibold text-orange-900 mb-2">
                            📋 {tableName.toUpperCase()} ({items.length})
                          </div>
                          <div className="space-y-1 text-sm">
                            {items.map((item, idx) => (
                              <div key={idx} className="text-gray-700 pl-2 border-l-2 border-orange-200">
                                {idx + 1}. {item.record_title || 'undefined'} 
                                <span className="text-gray-500 text-xs ml-2">
                                  (ID: {item.record_id || 'undefined'}, {new Date(item.created_at).toLocaleDateString('id-ID')})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Solusi:</strong> Gunakan tombol <span className="font-semibold text-red-600">"Fix Data Kreator"</span> untuk memperbaiki data ini secara otomatis.
                    </p>
                  </div>

                  <button
                    onClick={() => setKreatorPopup({ show: false, type: '', data: null, message: '' })}
                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </div>
              </>
            )}

            {/* Fix Confirm - Red Theme */}
            {kreatorPopup.type === 'fix-confirm' && (
              <>
                <div className="p-6 rounded-t-2xl bg-red-50 border-b border-red-100">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-red-100">
                      <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-semibold text-red-900">
                    🔧 Fix Data Kreator
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Fungsi Fitur Ini</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p className="mb-2"><strong>Fix Data Kreator</strong> memperbaiki data orphaned secara otomatis dengan meng-assign ke kreator pertama di sistem.</p>
                          <p className="mb-1">🔧 <strong>Proses:</strong></p>
                          <ul className="list-disc list-inside ml-2 space-y-1">
                            <li>Mencari kreator pertama (oldest)</li>
                            <li>Update kumpulan soal tanpa kreator</li>
                            <li>Assign ke kreator tersebut</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                    <p className="text-amber-800 text-sm">
                      ⚠️ <strong>Perhatian:</strong> Proses ini akan memperbaiki data kumpulan soal yang tidak memiliki kreator. Data tersebut akan di-assign ke kreator pertama yang ada di sistem.
                    </p>
                  </div>

                  <p className="text-center text-gray-700 font-medium mb-6">
                    Lanjutkan proses perbaikan?
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setKreatorPopup({ show: false, type: '', data: null, message: '' });
                        handleFixMissingCreatorsConfirmed();
                      }}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                    >
                      Oke
                    </button>
                    <button
                      onClick={() => setKreatorPopup({ show: false, type: '', data: null, message: '' })}
                      className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Fix Success - Red/Green Theme */}
            {kreatorPopup.type === 'fix-success' && (
              <>
                <div className="p-6 rounded-t-2xl bg-green-50 border-b border-green-100">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-green-100">
                      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-semibold text-green-900">
                    ✅ Data Berhasil Diperbaiki!
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <p className="text-green-800 font-medium mb-3">{kreatorPopup.message}</p>
                    {kreatorPopup.data && (
                      <div className="bg-white p-4 rounded border border-green-200">
                        <p className="text-sm font-semibold text-gray-800 mb-3">📊 Detail Perbaikan:</p>
                        <div className="space-y-2 text-sm text-gray-700">
                          {/* Kumpulan Soal */}
                          <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                            <span>📝 Kumpulan soal diupdate:</span>
                            <span className="font-bold text-blue-600">{kreatorPopup.data.kumpulan_soal_updated || 0}</span>
                          </div>
                          
                          {/* Materi */}
                          <div className="flex justify-between items-center bg-purple-50 p-2 rounded">
                            <span>📚 Materi diupdate:</span>
                            <span className="font-bold text-purple-600">{kreatorPopup.data.materi_updated || 0}</span>
                          </div>
                          
                          {/* Kategori */}
                          <div className="flex justify-between items-center bg-amber-50 p-2 rounded">
                            <span>🏷️ Kategori diupdate:</span>
                            <span className="font-bold text-amber-600">{kreatorPopup.data.kategori_updated || 0}</span>
                          </div>
                          
                          {/* Total */}
                          <div className="flex justify-between items-center bg-green-100 p-2 rounded border border-green-300">
                            <span className="font-semibold">✨ Total diupdate:</span>
                            <span className="font-bold text-green-700 text-lg">{kreatorPopup.data.total_updated || 0}</span>
                          </div>
                          
                          {/* Kreator Info */}
                          {kreatorPopup.data.total_updated > 0 && kreatorPopup.data.kreator_nama && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="flex justify-between items-center">
                                <span>👤 Assigned ke:</span>
                                <span className="font-semibold text-blue-600">{kreatorPopup.data.kreator_nama}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span>🆔 Kreator ID:</span>
                                <span className="font-mono text-gray-600">{kreatorPopup.data.assigned_to_kreator_id}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setKreatorPopup({ show: false, type: '', data: null, message: '' })}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </div>
              </>
            )}

            {/* Fix Warning - Red Theme */}
            {kreatorPopup.type === 'fix-warning' && (
              <>
                <div className="p-6 rounded-t-2xl bg-amber-50 border-b border-amber-100">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-amber-100">
                      <AlertCircle className="h-8 w-8 text-amber-600" />
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-semibold text-amber-900">
                    ⚠️ Perhatian
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-amber-50 p-4 rounded-lg mb-4">
                    <p className="text-amber-800">{kreatorPopup.message}</p>
                  </div>
                  <button
                    onClick={() => setKreatorPopup({ show: false, type: '', data: null, message: '' })}
                    className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </div>
              </>
            )}

            {/* Error - Red Theme */}
            {kreatorPopup.type === 'error' && (
              <>
                <div className="p-6 rounded-t-2xl bg-red-50 border-b border-red-100">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-red-100">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-semibold text-red-900">
                    ❌ Gagal
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 text-center mb-6">
                    {kreatorPopup.message}
                  </p>
                  <button
                    onClick={() => setKreatorPopup({ show: false, type: '', data: null, message: '' })}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Oke
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardAdmin;
