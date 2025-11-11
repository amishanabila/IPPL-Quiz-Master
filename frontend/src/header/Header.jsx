import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { ChevronDown } from "lucide-react";
import HeaderMobile from "./HeaderMobile";
import KonfirmasiLogout from "../popup/KonfirmasiLogout";

export default function Header() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await authService.getProfile();
        if (res && res.status === "success" && res.data && res.data.user) {
          const storedPhoto = localStorage.getItem("profilePhoto");
          if (!mounted) return;
          setUser({ ...res.data.user, foto: storedPhoto || res.data.user.foto });
        } else {
          const local = authService.getCurrentUser();
          if (local) {
            const storedPhoto = localStorage.getItem("profilePhoto");
            setUser({ ...local, foto: storedPhoto || local.foto });
          } else navigate("/login");
        }
      } catch {
        const local = authService.getCurrentUser();
        if (local) {
          const storedPhoto = localStorage.getItem("profilePhoto");
          setUser({ ...local, foto: storedPhoto || local.foto });
        } else navigate("/login");
      }
    })();

    function onProfileUpdated(e) {
      const updatedUser = e.detail || authService.getCurrentUser();
      const storedPhoto = localStorage.getItem("profilePhoto");
      setUser({ ...updatedUser, foto: storedPhoto || updatedUser.foto });
    }
    window.addEventListener("profileUpdated", onProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("profileUpdated", onProfileUpdated);
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
    authService.logout();
    setShowLogoutPopup(false);
    navigate("/");
  };

  const cancelLogout = () => setShowLogoutPopup(false);

  return (
    <header className="w-full bg-[#fbe497] relative z-50">
      <div className="flex flex-wrap items-center justify-between px-4 md:px-8 py-3 gap-4">
        {/* === Logo === */}
        <img
          src="/logo.png"
          alt="QuizMaster Logo"
          className="h-[80px] w-[80px] md:h-[120px] md:w-[120px]"
        />

        {/* === Profil User (Desktop) === */}
        <div
          className="hidden md:flex items-center relative"
          ref={dropdownRef}
        >
          <div
            className="flex items-center gap-2 rounded-full overflow-hidden border-2 border-black p-2 cursor-pointer bg-[#FFB347] hover:bg-orange-700 group transition"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <img
              src={user?.foto || "/icon/default-avatar.png"}
              alt={user?.nama || "pengguna"}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span
              className="text-sm font-bold text-black group-hover:text-white transition-colors max-w-[80px] truncate"
              title={user?.nama}
            >
              {user?.nama || "User"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-all duration-200 ${
                isDropdownOpen
                  ? "rotate-180 text-white"
                  : "text-black group-hover:text-white"
              }`}
            />
          </div>

          {/* Dropdown */}
          <div
            className={`absolute right-0 mt-[110px] w-40 bg-[#FFB347] rounded shadow z-50 font-semibold border border-black transition-all duration-200 origin-top ${
              isDropdownOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
          >
            <Link
              to="/profil"
              className="block px-4 py-2 text-xs hover:bg-orange-700 hover:text-white transition"
              onClick={() => setIsDropdownOpen(false)}
            >
              Pengaturan Akun
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-xs hover:bg-orange-700 hover:text-white transition"
            >
              Keluar
            </button>
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
    </header>
  );
}
