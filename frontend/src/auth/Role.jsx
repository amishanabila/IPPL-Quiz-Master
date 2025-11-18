import React from "react";
import { useNavigate } from "react-router-dom";

export default function Role() {
  const navigate = useNavigate();

  const handlePeserta = () => {
    navigate("/halaman-awal-peserta"); // halaman awal peserta (PIN + Nama)
  };

  const handlePembuatSoal = () => {
    navigate("/login"); // arahkan ke login pembuat soal
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 p-4">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg text-center border-4 border-white/50 transform transition-all duration-300 hover:shadow-3xl">
        {/* Logo dengan animasi bounce */}
        <div className="flex justify-center mb-6 animate-bounce">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full blur-lg opacity-50"></div>
            <img
              src="/logo.png"
              alt="QuizMaster Logo"
              className="relative h-[150px] w-[150px] drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Title dengan gradient */}
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-yellow-600 to-green-600 mb-3 animate-pulse">
          Selamat Datang di QuizMaster
        </h1>
        <p className="mb-8 text-gray-700 font-medium text-base sm:text-lg">
          Silakan pilih peran Anda untuk masuk ke sistem.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={handlePeserta}
            className="group relative bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2 text-lg">
              <span className="text-2xl">👨‍🎓</span>
              Masuk sebagai Peserta
            </span>
          </button>

          <button
            onClick={handlePembuatSoal}
            className="group relative bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2 text-lg">
              <span className="text-2xl">✏️</span>
              Masuk sebagai Pembuat Soal
            </span>
          </button>
        </div>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
        </div>
      </div>
    </div>
  );
}
