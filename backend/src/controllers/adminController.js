const db = require('../config/db');

// Get system overview statistics
const getSystemOverview = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_get_system_overview()');
    
    if (results && results[0] && results[0].length > 0) {
      res.json({
        success: true,
        data: {
          overview: results[0][0]
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          overview: {}
        }
      });
    }
  } catch (error) {
    console.error('Error getting system overview:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik sistem',
      error: error.message
    });
  }
};

// Get health check results
const getHealthCheck = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_health_check()');
    
    res.json({
      success: true,
      data: results[0] || []
    });
  } catch (error) {
    console.error('Error getting health check:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat health check',
      error: error.message
    });
  }
};

// Get quiz activity
const getQuizActivity = async (req, res) => {
  try {
    const { days = 30, limit = 100 } = req.query;
    
    const [results] = await db.execute(
      'CALL sp_admin_get_quiz_activity(?, ?)',
      [parseInt(days), parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: results[0] || []
    });
  } catch (error) {
    console.error('Error getting quiz activity:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil aktivitas quiz',
      error: error.message
    });
  }
};

// Export users data
const exportUsers = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_export_users()');
    
    res.json({
      success: true,
      data: results[0] || []
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export users',
      error: error.message
    });
  }
};

// Export hasil quiz data
const exportHasilQuiz = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_export_hasil_quiz()');
    
    res.json({
      success: true,
      data: results[0] || []
    });
  } catch (error) {
    console.error('Error exporting hasil quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export hasil quiz',
      error: error.message
    });
  }
};

// Export soal data
const exportSoal = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_export_soal()');
    
    res.json({
      success: true,
      data: results[0] || []
    });
  } catch (error) {
    console.error('Error exporting soal:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat export soal',
      error: error.message
    });
  }
};

// Get backup info
const getBackupInfo = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_get_backup_info()');
    
    if (results && results[0] && results[0].length > 0) {
      res.json({
        success: true,
        data: results[0][0]
      });
    } else {
      res.json({
        success: true,
        data: {}
      });
    }
  } catch (error) {
    console.error('Error getting backup info:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil info backup',
      error: error.message
    });
  }
};

// Get all users with statistics (including peserta from quiz_session)
const getAllUsers = async (req, res) => {
  try {
    console.log('📊 Getting all users including peserta...');
    const [results] = await db.execute('CALL sp_admin_get_all_users_with_peserta()');
    
    const users = results[0] || [];
    console.log(`✅ Found ${users.length} users (Admin + Kreator + Peserta)`);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data users',
      error: error.message
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    
    if (!userId || !newRole) {
      return res.status(400).json({
        success: false,
        message: 'User ID dan role baru harus diisi'
      });
    }

    if (!['admin', 'kreator', 'peserta'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid. Harus admin, kreator, atau peserta'
      });
    }

    await db.execute(
      'CALL sp_admin_update_user_role(?, ?)',
      [userId, newRole]
    );
    
    res.json({
      success: true,
      message: 'Role user berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat update role user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID harus diisi'
      });
    }

    await db.execute('CALL sp_admin_delete_user(?)', [userId]);
    
    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus user',
      error: error.message
    });
  }
};

// Fix missing creators (assign orphaned data to default kreator)
const fixMissingCreators = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_fix_missing_creators()');
    
    res.json({
      success: true,
      message: 'Data creator berhasil diperbaiki',
      data: results[0] && results[0][0] ? results[0][0] : {}
    });
  } catch (error) {
    console.error('Error fixing missing creators:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbaiki data creator',
      error: error.message
    });
  }
};

// Get orphaned data (data without valid creator)
const getOrphanedData = async (req, res) => {
  try {
    const [results] = await db.execute('CALL sp_admin_get_orphaned_data()');
    
    res.json({
      success: true,
      data: results[0] || []
    });
  } catch (error) {
    console.error('Error getting orphaned data:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data orphaned',
      error: error.message
    });
  }
};

module.exports = {
  getSystemOverview,
  getHealthCheck,
  getQuizActivity,
  exportUsers,
  exportHasilQuiz,
  exportSoal,
  getBackupInfo,
  getAllUsers,
  updateUserRole,
  deleteUser,
  fixMissingCreators,
  getOrphanedData
};
