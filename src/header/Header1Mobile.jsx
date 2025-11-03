// src/header/Header1Mobile.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Header1Mobile() {
  const navigate = useNavigate();
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
          isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {/* Input PIN */}
        <div className="flex flex-col gap-2">
          <span className="font-bold">Join Game? Enter PIN:</span>
          <input
            type="text"
            placeholder="123 456"
            className="border-2 border-black rounded-full px-4 py-2 text-center text-lg font-semibold outline-none"
          />
        </div>

        {/* Tombol Masuk */}
        <button
          className="bg-[#FFB347] border-2 border-black px-4 py-2 rounded-full font-bold shadow hover:bg-orange-700 hover:text-white transition w-full"
          onClick={() => {
            setIsOpen(false);
            navigate("/login");
          }}
        >
          Masuk
        </button>
      </div>
    </div>
  );
}
