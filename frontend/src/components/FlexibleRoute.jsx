import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * FlexibleRoute - Route yang support peserta (tanpa login) DAN kreator/admin (dengan login)
 * Digunakan untuk halaman soal, hasil akhir, dll yang bisa diakses peserta maupun user login
 */
export default function FlexibleRoute({ children }) {
  const location = useLocation();
  
  // Check apakah ini peserta (dari flow PIN & nama)
  const isPeserta = location.state?.isPeserta === true;
  const hasQuizData = location.state?.quizData != null;
  const hasHasilData = location.state?.hasil != null; // For hasil-akhir page
  const hasNama = location.state?.nama != null;
  
  console.log('🔓 FlexibleRoute - Check akses:');
  console.log('   Path:', location.pathname);
  console.log('   isPeserta flag:', isPeserta);
  console.log('   hasQuizData:', hasQuizData);
  console.log('   hasHasilData:', hasHasilData);
  console.log('   hasNama:', hasNama);
  console.log('   isAuthenticated:', authService.isAuthenticated());
  
  // Peserta dengan data quiz (dari PIN validation) - untuk /soal/:slug
  if (isPeserta && hasQuizData && hasNama) {
    console.log('✅ FlexibleRoute - Akses diizinkan untuk PESERTA (via PIN + quizData)');
    return children;
  }
  
  // Peserta dengan hasil data - untuk /hasil-akhir
  if (isPeserta && hasHasilData) {
    console.log('✅ FlexibleRoute - Akses diizinkan untuk PESERTA (via hasil data)');
    return children;
  }
  
  // Check localStorage untuk hasil quiz (fallback)
  if (location.pathname === '/hasil-akhir') {
    const hasilQuizInStorage = localStorage.getItem('hasilQuiz');
    if (hasilQuizInStorage) {
      console.log('✅ FlexibleRoute - Akses diizinkan untuk /hasil-akhir (data in localStorage)');
      return children;
    }
  }
  
  // User yang sudah login (kreator/admin)
  if (authService.isAuthenticated()) {
    const token = authService.getToken();
    if (token) {
      console.log('✅ FlexibleRoute - Akses diizinkan untuk USER LOGIN');
      return children;
    }
  }
  
  // Tidak ada kredensial yang valid
  console.log('❌ FlexibleRoute - Akses ditolak, redirect ke home');
  console.log('❌ Reason: No valid credentials (isPeserta, hasil, or authentication)');
  return <Navigate to="/" replace />;
}
