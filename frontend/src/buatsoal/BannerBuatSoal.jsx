import React from "react";
import { useNavigate } from "react-router-dom";

export default function BannerBuatSoal() {
  const navigate = useNavigate();

  const handleBuatSoal = () => {
    console.log("Navigating to /buat-soal");
    navigate("/buat-soal");
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleBuatSoal}
        className="group relative w-full bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 hover:from-teal-600 hover:via-teal-700 hover:to-cyan-700 text-white rounded-3xl shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-teal-500/50 overflow-hidden p-8 border-4 border-white/30"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                <span className="text-4xl">📝</span>
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-black mb-1">
                  Buat Kuis Sendiri
                </h2>
                <p className="text-teal-100 text-sm font-semibold">
                  Buat soal kuis untuk peserta
                </p>
              </div>
            </div>
            <span className="text-4xl opacity-50 group-hover:opacity-100 transition-opacity">✨</span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-teal-50 text-sm font-medium">
              Rasakan bagaimana rasanya membuat kuis!
            </p>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl font-bold text-sm group-hover:bg-white/30 transition-colors">
              Buat Soal →
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </button>
    </div>
  );
}
