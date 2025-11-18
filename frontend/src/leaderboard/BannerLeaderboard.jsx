import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, TrendingUp, Award } from "lucide-react";

export default function BannerLeaderboard() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/leaderboard");
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        className="group relative w-full bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-purple-600 hover:to-pink-600 text-white rounded-3xl shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-purple-500/50 overflow-hidden p-8 border-4 border-white/30"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                <Trophy className="w-10 h-10 text-yellow-300" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-black mb-1 flex items-center gap-2">
                  🏆 Leaderboard
                </h2>
                <p className="text-purple-100 text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Lihat peringkat peserta terbaik
                </p>
              </div>
            </div>
            <Award className="w-12 h-12 text-yellow-300 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-purple-50 text-sm font-medium">
              Cek siapa yang mendapat skor tertinggi!
            </p>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl font-bold text-sm group-hover:bg-white/30 transition-colors">
              Lihat Peringkat →
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </button>
    </div>
  );
}
