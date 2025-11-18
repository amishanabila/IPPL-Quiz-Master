import React from "react";
import { useNavigate } from "react-router-dom";

export default function SoalBelumTersedia() {
  const navigate = useNavigate();

  return (
    <div className="text-center py-16 px-8 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-orange-200 max-w-md w-full transform transition-all duration-300 hover:shadow-3xl">
      <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <span className="text-7xl">📝</span>
      </div>
      <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 mb-4">
        Soal Belum Tersedia
      </h1>
      <p className="text-gray-600 font-medium text-lg mb-8">
        Soal untuk materi ini belum tersedia. Silakan hubungi pembuat soal atau coba lagi nanti.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="group relative px-8 py-4 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        <span className="relative flex items-center gap-2 text-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Kembali</span>
        </span>
      </button>
    </div>
  );
}
