import React from "react";
import { useNavigate } from "react-router-dom";
import Header1Mobile from "./Header1Mobile";

export default function Header1() {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-[#fbe497] relative z-50">
      <div className="flex items-center justify-between px-2 md:px-8 h-[150px]">
        {/* Logo */}
        <img
          src="/logo.png"
          alt="QuizMaster Logo"
          className="h-[120px] w-[120px]"
        />

        {/* Desktop PIN input */}
        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center bg-[#FFD580] rounded-lg px-6 py-3 gap-4 w-full max-w-xl">
            <span className="font-bold whitespace-nowrap">Join Game? Enter PIN:</span>
            <input
              type="text"
              placeholder="123 456"
              className="border-2 border-black rounded-full px-7 py-2 w-40 text-center font-semibold outline-none"
            />
          </div>
        </div>

        {/* Desktop Sign in */}
        <button
          className="hidden md:block bg-[#FFB347] border-2 border-black px-4 py-2 rounded-full font-bold shadow hover:bg-orange-700 hover:text-white transition mr-4"
          onClick={() => navigate("/login")}
        >
          Masuk
        </button>

        {/* Mobile Hamburger & Menu */}
        <Header1Mobile />
      </div>
    </header>
  );
}
