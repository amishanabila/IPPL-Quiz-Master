import React from "react";
import Header from "./header/Header";
import KumpulanMateri from "./materi/KumpulanMateri";
import BannerBuatSoal from "./Buat Soal/BannerBuatSoal";
import BannerLeaderboard from "./leaderboard/BannerLeaderboard";
import Footer from "./footer/Footer";

export default function HalamanAwal() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="flex-1 flex flex-col relative z-10">
        <Header/>
        
        {/* Banner Section - Buat Soal & Leaderboard Side by Side */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BannerBuatSoal/>
            <BannerLeaderboard/>
          </div>
        </div>
        
        <div className="flex-1">
          <KumpulanMateri/>
        </div>
      </div>
      
      <Footer/>
    </div>
  );
}
