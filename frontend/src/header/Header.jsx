import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { ChevronDown } from "lucide-react";
import HeaderMobile from "./HeaderMobile";
import KonfirmasiLogout from "../popup/KonfirmasiLogout";
import LogoutBerhasil from "../popup/LogoutBerhasil";

export default function Header() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = authService.getToken();
        
        if (!token) {
          if (mounted) {
            const local = authService.getCurrentUser();
            if (local) {
              setUser({ ...local, foto: null });
            }
            // Tidak redirect otomatis, biarkan halaman yang handle sendiri
          }
          setLoading(false);
          return;
        }

        const res = await authService.getProfile();
        
        if (res && res.status === "success" && res.data && res.data.user) {
          if (mounted) {
            const userData = res.data.user;
            setUser(userData);
          }
        } else {
          throw new Error(res?.message || "Gagal memuat profil");
        }
      } catch (err) {
        console.error("Header - Failed to fetch profile:", err);
        
        // If token is invalid (401), auto-logout
        if (err.message && err.message.includes('401')) {
          console.log("Header - Token invalid, logging out");
          authService.logout();
          if (mounted) {
            setUser(null);
          }
          return;
        }
        
        // Fallback to localStorage
        const local = authService.getCurrentUser();
        if (local && mounted) {
          setUser({ ...local, foto: null });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    // Listen for profile updates
    const handleProfileUpdated = (e) => {
      const updatedUser = e.detail;
      if (mounted) {
        setUser(updatedUser);
      }
    };
    
    window.addEventListener("profileUpdated", handleProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("profileUpdated", handleProfileUpdated);
    };
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setShowLogoutPopup(true);
  };

  const confirmLogout = () => {
    console.log('🚪 Header - Logout confirmed');
    authService.logout();
    setShowLogoutPopup(false);
    setShowLogoutSuccess(true);
  };

  const cancelLogout = () => setShowLogoutPopup(false);

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm shadow-lg border-b-2 border-orange-200 relative z-40">
      <div className="flex flex-wrap items-center justify-between px-4 md:px-8 py-3 gap-4">
        {/* === Logo with Brand === */}
        <div className="flex items-center gap-3 relative group cursor-pointer" onClick={() => {
          const destination = user?.role === 'admin' ? '/admin/dashboard' : '/halaman-awal-kreator';
          navigate(destination);
        }}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <img
              src="/logo.png"
              alt="QuizMaster Logo"
              className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] relative drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="hidden md:block">
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
              QuizMaster
            </h1>
            <p className="text-xs text-gray-600 font-medium">Create • Learn • Excel</p>
          </div>
        </div>

        {/* === Profil User (Desktop) === */}
        <div
          className="hidden md:flex items-center relative"
          ref={dropdownRef}
        >
          <div
            className="flex items-center gap-2 rounded-full overflow-hidden border-2 border-orange-400 p-2 cursor-pointer bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 group transition-all shadow-lg"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <img
              src={user?.foto || "icon/user.png"}
              alt={user?.nama || "pengguna"}
              className="w-6 h-6 rounded-full object-cover border-2 border-white"
              onError={(e) => {
                e.target.src = "user.png";
              }}
            />
            <span
              className="text-sm font-bold text-white transition-colors max-w-[80px] truncate"
              title={user?.nama}
            >
              {user?.nama || "User"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-all duration-200 text-white ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown */}
          <div
            className={`absolute right-0 mt-[110px] w-48 bg-gradient-to-br from-orange-50 to-yellow-50 backdrop-blur-sm rounded-xl shadow-2xl z-[100] font-semibold border-2 border-orange-300 transition-all duration-200 origin-top ${
              isDropdownOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
          >
            <div className="p-2 space-y-1">
              {/* Only show Pengaturan Akun for non-admin users */}
              {user?.role !== 'admin' && (
                <Link
                  to="/profil"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-800 hover:bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500 hover:text-white transition-all duration-200 rounded-lg font-semibold group"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="text-lg">⚙️</span>
                  <span>Pengaturan Akun</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gradient-to-r hover:from-red-400 hover:to-red-500 hover:text-white transition-all duration-200 rounded-lg font-semibold group"
              >
                <span className="text-lg">🚪</span>
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* === Header versi mobile === */}
        <div className="block md:hidden ml-auto">
          <HeaderMobile user={user} onLogout={handleLogout} />
        </div>
      </div>

      {showLogoutPopup && (
        <KonfirmasiLogout onConfirm={confirmLogout} onCancel={cancelLogout} />
      )}
      
      {showLogoutSuccess && (
        <LogoutBerhasil isAdmin={false} />
      )}
    </header>
  );
}
