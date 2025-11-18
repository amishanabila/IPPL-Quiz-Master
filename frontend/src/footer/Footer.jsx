import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-orange-400 to-yellow-500 text-white py-8 text-center font-poppins shadow-2xl border-t-4 border-white/50 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex justify-center gap-2 mb-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
        </div>
        <p className="text-lg font-bold">
          © 2025 <span className="font-black text-xl">QuizMaster</span>
        </p>
        <p className="text-sm font-medium opacity-90 mt-1">
          ✨ Platform Quiz Interaktif Terbaik
        </p>
      </div>
    </footer>
  );
}
