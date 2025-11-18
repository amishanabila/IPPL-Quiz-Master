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
        className={`absolute top-[100%] left-0 w-full bg-[#FFD580] shadow-md z-[90] flex flex-col px-5 py-4 space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >

        {/* Akun Section */}
        <div className="flex items-center gap-2 rounded-full overflow-hidden border-2 border-black p-2 bg-[#FFB347]">
          <img
            src={currentUser?.foto || "icon/user.png"}
            alt={currentUser?.nama || 'pengguna'}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-bold text-black">{currentUser?.nama || 'User'}</span>
        </div>

        {/* Links */}
        <Link
          to="/profil"
          className="group flex items-center gap-2 hover:bg-orange-700 p-2 rounded transition"
          onClick={() => setIsOpen(false)}
        >
          <span className="text-sm font-semibold text-black group-hover:text-white">
            Pengaturan Akun
          </span>
        </Link>

        {/* Logout */}
        <button
          onClick={() => {
            if (onLogout) onLogout();
            setIsOpen(false);
          }}
          className="group flex items-center gap-2 hover:bg-orange-700 p-2 rounded transition"
        >
          <span className="text-sm font-semibold text-black group-hover:text-white">
            Keluar
          </span>
        </button>
      </div>
    </div>
  );
};

export default HeaderMobile;
