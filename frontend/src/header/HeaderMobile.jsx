// src/header/HeaderMobile.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const HeaderMobile = ({ onLogout, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const menuRef = useRef(null);

  // Update currentUser ketika user prop berubah
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Listen untuk profile updates
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const updatedUser = e.detail;
      setCurrentUser(updatedUser);
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  // Tutup menu jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="md:hidden">
      {/* Tombol Hamburger */}
      <button
        className="flex flex-col justify-center items-center w-10 h-10 relative z-[100]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`block h-[3px] w-6 bg-black rounded transition-transform duration-300 ease-in-out ${
            isOpen ? "rotate-45 translate-y-[7px]" : ""
          }`}
        />
        <span
          className={`block h-[3px] w-6 bg-black rounded my-[4px] transition-opacity duration-300 ease-in-out ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-[3px] w-6 bg-black rounded transition-transform duration-300 ease-in-out ${
            isOpen ? "-rotate-45 -translate-y-[7px]" : ""
          }`}
        />
      </button>

      {/* Mobile Menu */}
      <div
        className={`absolute top-[100%] left-0 w-full bg-gradient-to-br from-orange-100 to-yellow-100 shadow-2xl z-[90] flex flex-col px-5 py-4 space-y-3 overflow-hidden transition-all duration-300 ease-in-out border-b-4 border-orange-300 ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >

        {/* Akun Section */}
        <div className="flex items-center gap-3 rounded-xl overflow-hidden border-2 border-orange-300 p-3 bg-white shadow-lg">
          <img
            src={currentUser?.foto || "icon/user.png"}
            alt={currentUser?.nama || 'pengguna'}
            className="w-8 h-8 rounded-full object-cover border-2 border-orange-400"
          />
          <div className="flex-1">
            <span className="text-sm font-bold text-gray-800 block">{currentUser?.nama || 'User'}</span>
            <span className="text-xs text-gray-600">{currentUser?.email || ''}</span>
          </div>
        </div>

        {/* Links */}
        <Link
          to="/profil"
          className="group flex items-center gap-3 hover:bg-gradient-to-r hover:from-orange-400 hover:to-yellow-500 p-3 rounded-lg transition-all duration-200"
          onClick={() => setIsOpen(false)}
        >
          <span className="text-lg">⚙️</span>
          <span className="text-sm font-semibold text-gray-800 group-hover:text-white">
            Pengaturan Akun
          </span>
        </Link>

        {/* Logout */}
        <button
          onClick={() => {
            if (onLogout) onLogout();
            setIsOpen(false);
          }}
          className="group flex items-center gap-3 hover:bg-gradient-to-r hover:from-red-400 hover:to-red-500 p-3 rounded-lg transition-all duration-200 w-full text-left"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm font-semibold text-gray-800 group-hover:text-white">
            Keluar
          </span>
        </button>
      </div>
    </div>
  );
};

export default HeaderMobile;
