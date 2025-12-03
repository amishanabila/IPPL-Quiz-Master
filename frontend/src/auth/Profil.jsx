import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import EditProfilPopup from "../popup/EditProfilPopup";
import HapusAkunPopup from "../popup/HapusAkunPopup";
import HapusAkunBerhasilPopup from "../popup/HapusAkunBerhasilPopup";
import Footer from "../footer/Footer";

export default function Profil() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [profilePhoto, setProfilePhoto] = useState("user.png");
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showDeleteSuccessPopup, setShowDeleteSuccessPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load user profile from database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = authService.getToken();
        if (!token) {
          console.error("No token found");
          navigate("/login");
          return;
        }

        console.log("Fetching profile with token:", token.substring(0, 20) + "...");
        const res = await authService.getProfile();
        console.log("Profile response:", res);
        
        if (res && res.status === "success" && res.data && res.data.user) {
          const userData = res.data.user;
          console.log("User data received:", { ...userData, foto: userData.foto ? "has_foto" : "no_foto" });
          setUser(userData);
          if (userData.foto) {
            setProfilePhoto(userData.foto);
          } else {
            setProfilePhoto("user.png");
          }
        } else {
          console.error("Invalid response format:", res);
          throw new Error(res?.message || "Gagal memuat profil");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError(`Gagal memuat profil: ${err.message || "Silakan coba lagi."}`);
        // Fallback to local storage
        const local = authService.getCurrentUser();
        if (local) {
          console.log("Using localStorage data:", local);
          setUser(local);
          setProfilePhoto("user.png");
        } else {
          setTimeout(() => navigate("/login"), 3000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();

    // Listen for profile updates
    const handleProfileUpdate = (e) => {
      const updatedUser = e.detail;
      setUser(updatedUser);
      if (updatedUser.foto) {
        setProfilePhoto(updatedUser.foto);
      }
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, [navigate]);

  const handleSaveProfile = (updatedData) => {
    setUser(updatedData);
    if (updatedData.foto) {
      setProfilePhoto(updatedData.foto);
    }
    setShowEditPopup(false);
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const response = await authService.deleteAccount();
      
      if (response.status === 'success' || response.success) {
        setShowDeletePopup(false);
        setShowDeleteSuccessPopup(true);
      } else {
        alert(response.message || 'Gagal menghapus akun. Silakan coba lagi.');
        setShowDeletePopup(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Terjadi kesalahan saat menghapus akun. Silakan coba lagi.');
      setShowDeletePopup(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSuccess = () => {
    setShowDeleteSuccessPopup(false);
    navigate('/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <p className="text-lg font-semibold text-gray-700">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* === Header === */}
      <div className="relative py-6 flex items-center justify-center z-10">
        <button
          onClick={() => navigate("/halaman-awal-kreator")}
          className="absolute top-6 left-6 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white hover:shadow-lg transition-all font-semibold text-gray-700 border-2 border-orange-200"
        >
          ← Kembali
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
          Profil Saya
        </h1>
      </div>

      {/* === Error Message === */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* === Konten Profil === */}
      <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl mt-6 mb-6 relative z-10 border-2 border-orange-200">
        {/* Foto Profil */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 relative">
            <div className="absolute inset-0 bg-orange-300/40 blur-2xl rounded-full"></div>
            <img
              src={profilePhoto}
              alt="Profil"
              className="w-40 h-40 rounded-full object-cover border-4 border-orange-400 shadow-xl relative"
              onError={(e) => {
                e.target.src = "icon/user.png";
              }}
            />
          </div>
        </div>

        {/* Info Profil */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-orange-500">👤</span>
              Nama Lengkap
            </label>
            <div className="w-full px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-orange-200 shadow-md font-medium">
              {user.nama || "Belum diset"}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-orange-500">📧</span>
              Email
            </label>
            <div className="w-full px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-orange-200 shadow-md font-medium">
              {user.email || "Belum diset"}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-orange-500">📱</span>
              Nomor Telepon
            </label>
            <div className="w-full px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-orange-200 shadow-md font-medium">
              {user.telepon || "-"}
            </div>
          </div>
        </div>

        {/* Tombol Edit Profil */}
        <button
          onClick={() => setShowEditPopup(true)}
          className="w-full px-6 py-3 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-3"
        >
          ✏️ Edit Profil
        </button>

        {/* Tombol Hapus Akun */}
        <button
          onClick={() => setShowDeletePopup(true)}
          disabled={deleting}
          className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? '⏳ Menghapus...' : '🗑️ Hapus Akun'}
        </button>
      </div>

      {/* Popup Edit Profil */}
      {showEditPopup && (
        <EditProfilPopup
          user={user}
          profilePhoto={profilePhoto}
          onClose={() => setShowEditPopup(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Popup Konfirmasi Hapus Akun */}
      {showDeletePopup && (
        <HapusAkunPopup
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeletePopup(false)}
        />
      )}

      {/* Popup Berhasil Hapus Akun */}
      {showDeleteSuccessPopup && (
        <HapusAkunBerhasilPopup
          onClose={handleDeleteSuccess}
        />
      )}

      <Footer />
    </div>
  );
}
