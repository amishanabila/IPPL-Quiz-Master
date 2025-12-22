import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "./services/authService";
import Header from "./header/Header";
import KumpulanMateri from "./materi/KumpulanMateri";
import BannerBuatSoal from "./buatsoal/BannerBuatSoal";
import BannerLeaderboard from "./leaderboard/BannerLeaderboard";
import EksporDataKreator from "./components/EksporDataKreator";
import Footer from "./footer/Footer";

export default function HalamanAwal() {
  const navigate = useNavigate();

  useEffect(() => {
    // VALIDASI AUTENTIKASI DAN ROLE - HARUS ADA TOKEN DAN ROLE KREATOR
    console.log('🔒 HalamanAwalKreator - Validasi akses');
    
    // Cek apakah user sudah login
    if (!authService.isAuthenticated()) {
      console.log('❌ HalamanAwalKreator - User belum login');
      alert('Anda harus login terlebih dahulu');
      navigate('/login', { replace: true });
      return;
    }

    // Cek token
    const token = authService.getToken();
    if (!token) {
      console.log('❌ HalamanAwalKreator - Token tidak ditemukan');
      authService.logout();
      alert('Sesi anda telah berakhir, silakan login kembali');
      navigate('/login', { replace: true });
      return;
    }

    // Cek role
    const userRole = authService.getUserRole();
    const userData = authService.getCurrentUser();
    const actualRole = userRole || userData?.role;
    
    console.log('👤 HalamanAwalKreator - User role:', actualRole);
    console.log('👤 HalamanAwalKreator - User data:', userData);
    
    // Jika admin, redirect ke dashboard admin
    if (actualRole === 'admin') {
      console.log('🔄 HalamanAwalKreator - User adalah admin, redirect ke dashboard');
      alert('Anda adalah admin. Redirect ke dashboard admin.');
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    
    // Jika bukan kreator, logout
    if (actualRole !== 'kreator') {
      console.log('❌ HalamanAwalKreator - Role tidak valid:', actualRole);
      alert('Akses ditolak. Halaman ini untuk kreator.');
      authService.logout();
      navigate('/login', { replace: true });
      return;
    }

    console.log('✅ HalamanAwalKreator - Validasi berhasil');
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="flex-1 flex flex-col relative z-10">
        <Header/>
        
        {/* Banner Section - Buat Soal & Leaderboard Side by Side */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BannerBuatSoal/>
            <BannerLeaderboard/>
          </div>
          
          {/* Export Data Section */}
          <EksporDataKreator />
        </div>
        
        <div className="flex-1">
          <KumpulanMateri/>
        </div>
      </div>
      
      <Footer/>
    </div>
  );
}
