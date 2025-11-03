import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react"; // ikon panah dropdown
import Header2Mobile from "./Header2Mobile";
import KonfirmasiLogout from "../popup/KonfirmasiLogout";

export default function Header2() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup dropdown saat klik di luar
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
    setShowLogoutPopup(false);
    navigate("/"); // redirect setelah logout
  };

  const cancelLogout = () => setShowLogoutPopup(false);

  return (
    <header className="w-full bg-[#fbe497] relative z-50">
      <div className="flex items-center justify-between px-2 md:px-8 h-[150px]">
        {/* Logo */}
        <img src="/logo.png" alt="QuizMaster Logo" className="h-[120px] w-[120px]" />

        {/* Desktop PIN input */}
        <div className="hidden md:flex flex-1 justify-center mr-[-41px]">
          <div className="flex items-center bg-[#FFD580] rounded-lg px-6 py-3 gap-4 w-full max-w-xl">
            <span className="font-bold whitespace-nowrap">Join Game? Enter PIN:</span>
            <input
              type="text"
              placeholder="123 456"
              className="border-2 border-black rounded-full px-7 py-2 w-40 text-center font-semibold outline-none"
            />
          </div>
        </div>

        {/* Desktop Account Dropdown */}
        <div className="hidden md:flex items-center mr-4 relative" ref={dropdownRef}>
          {/* Trigger */}
          <div
            className="flex items-center gap-2 rounded-full overflow-hidden border-2 border-black p-2 cursor-pointer bg-[#FFB347] hover:bg-orange-700 group transition"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <img
              src="/icon/amisha.jpg"
              alt="pengguna"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm font-bold text-black group-hover:text-white transition-colors">
              Amisha
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-all duration-200 ${
                isDropdownOpen
                  ? "rotate-180 text-white"
                  : "text-black group-hover:text-white"
              }`}
            />
          </div>

          {/* Dropdown menu */}
          <div
            className={`absolute left-[-30px] mt-[108px] w-40 bg-[#FFB347] rounded shadow z-50 font-semibold border border-black transition-all duration-200 origin-top ${
              isDropdownOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
          >
            <Link
              to="/pengaturan-akun"
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

        {/* Mobile Header */}
        <Header2Mobile />
      </div>

      {/* Popup Logout Desktop */}
      {showLogoutPopup && (
        <KonfirmasiLogout onConfirm={confirmLogout} onCancel={cancelLogout} />
      )}
    </header>
  );
}
