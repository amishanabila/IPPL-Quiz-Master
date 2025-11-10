// src/header/Header2Mobile.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const Header2Mobile = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

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
        className="flex flex-col justify-center items-center w-10 h-10 relative z-50"
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
        className={`absolute top-[100%] left-0 w-full bg-[#FFD580] shadow-md z-40 flex flex-col px-5 py-4 space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {/* PIN Input */}
        <div className="flex flex-col gap-2">
          <span className="font-bold">Join Game? Enter PIN:</span>
          <input
            type="text"
            placeholder="123 456"
            className="border-2 border-black rounded-full px-4 py-2 text-center text-lg font-semibold outline-none"
          />
        </div>

        {/* Akun Section */}
        <div className="flex items-center gap-2 rounded-full overflow-hidden border-2 border-black p-2 bg-[#FFB347]">
          <img
            src="/icon/amisha.jpg"
            alt="pengguna"
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-bold text-black">Amisha</span>
        </div>

        {/* Links */}
        <Link
          to="/pengaturan-akun"
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
            onLogout();
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

export default Header2Mobile;
