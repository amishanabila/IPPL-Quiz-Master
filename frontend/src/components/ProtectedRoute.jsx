  import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * ProtectedRoute - Component untuk melindungi routes berdasarkan autentikasi dan role
 * @param {Object} props
 * @param {React.Component} props.children - Component yang akan di-render
 * @param {string} props.requiredRole - Role yang dibutuhkan ('admin', 'kreator', atau null untuk semua user)
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  // Cek apakah user sudah login
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: User belum login, redirect ke /login');
    return <Navigate to="/login" replace />;
  }

  // Validasi token
  const token = authService.getToken();
  if (!token) {
    console.log('❌ ProtectedRoute: Token tidak ditemukan, logout dan redirect ke /login');
    authService.logout();
    return <Navigate to="/login" replace />;
  }

  // Jika ada requirement role tertentu
  if (requiredRole) {
    const userRole = authService.getUserRole();
    const userData = authService.getCurrentUser();
    
    console.log('🔒 ProtectedRoute: Validasi role');
    console.log('   Required role:', requiredRole);
    console.log('   User role:', userRole);
    console.log('   User data:', userData);
    
    // Validasi role dari dua sumber
    const actualRole = userRole || userData?.role;
    
    if (actualRole !== requiredRole) {
      console.log(`❌ ProtectedRoute: Akses ditolak. User role: ${actualRole}, Required: ${requiredRole}`);
      
      // Redirect berdasarkan role user
      if (actualRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (actualRole === 'kreator') {
        return <Navigate to="/halaman-awal-kreator" replace />;
      } else {
        // Role tidak dikenali, logout
        authService.logout();
        return <Navigate to="/login" replace />;
      }
    }
    
    console.log('✅ ProtectedRoute: Akses diizinkan untuk role', actualRole);
  }

  // Semua validasi lolos, render component
  return children;
}
