import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Crown, TrendingUp, Star, RotateCcw, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../footer/Footer";
import { apiService } from "../services/api";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Filter states
  const [kategoriList, setKategoriList] = useState([]);
  const [materiList, setMateriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedMateri, setSelectedMateri] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchKategoriList();
    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    if (selectedKategori) {
      fetchMateriList(selectedKategori);
    } else {
      setMateriList([]);
      setSelectedMateri('');
    }
  }, [selectedKategori]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedKategori, selectedMateri]);

  const fetchKategoriList = async () => {
    try {
      const response = await apiService.getKategoriWithStats();
      if (response.status === 'success') {
        setKategoriList(response.data);
      }
    } catch (err) {
      console.error('Error fetching kategori:', err);
    }
  };

  const fetchMateriList = async (kategoriId) => {
    try {
      const response = await apiService.getMateriByKategori(kategoriId);
      if (response.status === 'success') {
        setMateriList(response.data);
      }
    } catch (err) {
      console.error('Error fetching materi:', err);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      if (selectedKategori) filters.kategori_id = selectedKategori;
      if (selectedMateri) filters.materi_id = selectedMateri;
      
      const response = await apiService.getLeaderboard(filters);
      
      if (response.status === 'success') {
        setLeaderboardData(response.data);
      } else {
        setError(response.message || 'Gagal memuat data leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Terjadi kesalahan saat memuat data leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedKategori('');
    setSelectedMateri('');
  };

  const handleResetLeaderboard = async () => {
    try {
      setResetting(true);
      setError(null);
      const response = await apiService.resetLeaderboard();
      
      if (response.status === 'success') {
        setLeaderboardData([]);
        setShowResetConfirm(false);
        // Refresh data after reset
        await fetchLeaderboardData();
      } else {
        setError(response.message || 'Gagal mereset leaderboard');
      }
    } catch (err) {
      console.error('Error resetting leaderboard:', err);
      setError('Terjadi kesalahan saat mereset leaderboard');
    } finally {
      setResetting(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-orange-600" />;
      default:
        return <Star className="w-6 h-6 text-orange-400" />;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 shadow-lg shadow-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-orange-400 to-red-500 shadow-lg shadow-orange-500/50";
      default:
        return "bg-gradient-to-r from-orange-200 to-yellow-200";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        {/* Header with Back Button - Same style as Profil */}
        <div className="py-6 flex items-center justify-center">
          <button
            onClick={() => navigate("/halaman-awal-kreator")}
            className="absolute top-6 left-6 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white hover:shadow-lg transition-all font-semibold text-gray-700 border-2 border-orange-200"
          >
            ← Kembali
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={loading || resetting}
            className="absolute top-6 right-6 px-4 py-2 bg-red-500/90 backdrop-blur-sm rounded-xl hover:bg-red-600 hover:shadow-lg transition-all font-semibold text-white border-2 border-red-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Filter Section */}
          <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Filter className="w-5 h-5 text-orange-600" />
                Filter Leaderboard
              </h2>
              {(selectedKategori || selectedMateri) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2 transition-all"
                >
                  <X className="w-4 h-4" />
                  Clear Filter
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Kategori Filter */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="border-2 border-gray-300 p-3 rounded-lg w-full hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                >
                  <option value="">Semua Kategori</option>
                  {kategoriList.map((kat) => (
                    <option key={kat.kategori_id} value={kat.kategori_id}>
                      {kat.nama_kategori} ({kat.total_hasil} hasil)
                    </option>
                  ))}
                </select>
              </div>

              {/* Materi Filter */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Materi
                </label>
                <select
                  value={selectedMateri}
                  onChange={(e) => setSelectedMateri(e.target.value)}
                  disabled={!selectedKategori}
                  className="border-2 border-gray-300 p-3 rounded-lg w-full hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Semua Materi</option>
                  {materiList.map((mat) => (
                    <option key={mat.materi_id} value={mat.materi_id}>
                      {mat.judul} ({mat.total_hasil} hasil)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedKategori || selectedMateri) && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-gray-700">
                  Filter Aktif: 
                  {selectedKategori && (
                    <span className="ml-2 px-3 py-1 bg-orange-200 rounded-full text-orange-800">
                      {kategoriList.find(k => k.kategori_id == selectedKategori)?.nama_kategori}
                    </span>
                  )}
                  {selectedMateri && (
                    <span className="ml-2 px-3 py-1 bg-yellow-200 rounded-full text-yellow-800">
                      {materiList.find(m => m.materi_id == selectedMateri)?.judul}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Statistics Summary */}
          {!loading && !error && leaderboardData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-5 border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Total Peserta</p>
                    <p className="text-2xl font-black text-gray-800">{leaderboardData.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-5 border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Skor Tertinggi</p>
                    <p className="text-2xl font-black text-gray-800">
                      {Math.max(...leaderboardData.map(d => d.skor))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-5 border-2 border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Rata-rata Skor</p>
                    <p className="text-2xl font-black text-gray-800">
                      {Math.round(leaderboardData.reduce((sum, d) => sum + d.skor, 0) / leaderboardData.length)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtitle */}
          <div className="text-center mb-10">
            <p className="text-gray-700 text-lg font-semibold flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Top Peserta Dengan Skor Tertinggi
              {(selectedKategori || selectedMateri) && (
                <span className="text-orange-600">
                  (Filtered)
                </span>
              )}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-white/80 rounded-2xl shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-700 font-semibold">Memuat data leaderboard...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="inline-block p-6 bg-red-50 border-3 border-red-300 rounded-2xl shadow-xl">
                <p className="text-red-600 font-bold text-lg mb-2">⚠️ {error}</p>
                <button
                  onClick={fetchLeaderboardData}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard Content */}
          {!loading && !error && (
            <div className="max-w-4xl mx-auto">
              {leaderboardData.length === 0 ? (
                <div className="text-center py-12 bg-white/80 rounded-2xl shadow-xl">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-600 font-semibold text-lg">
                    Belum ada data leaderboard. Mulai kuis untuk melihat peringkat!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboardData.map((item, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;

                    return (
                      <div
                        key={index}
                        className={`
                          bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border-3 border-white/50
                          transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                          ${isTopThree ? 'p-6' : 'p-4'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank Badge */}
                          <div className={`
                            ${getRankBadgeColor(rank)}
                            ${isTopThree ? 'w-20 h-20' : 'w-14 h-14'}
                            rounded-2xl flex items-center justify-center flex-shrink-0 transform transition-transform hover:rotate-12
                          `}>
                            {isTopThree ? (
                              getRankIcon(rank)
                            ) : (
                              <span className="text-2xl font-black text-orange-700">
                                {rank}
                              </span>
                            )}
                          </div>

                          {/* Participant Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`
                              font-black text-gray-800 truncate
                              ${isTopThree ? 'text-2xl mb-1' : 'text-xl'}
                            `}>
                              {item.nama_peserta}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                📂 {item.kategori}
                              </span>
                              {item.materi && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                                  📚 {item.materi}
                                </span>
                              )}
                              {item.pin_code && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                                  🔑 PIN: {item.pin_code}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <div className={`
                            text-right flex-shrink-0
                            ${isTopThree ? 'ml-4' : ''}
                          `}>
                            <div className={`
                              font-black bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent
                              ${isTopThree ? 'text-4xl' : 'text-3xl'}
                            `}>
                              {item.skor}
                            </div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                              Poin
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className={`mt-4 pt-4 border-t-2 border-orange-100 ${isTopThree ? 'grid grid-cols-2 gap-3' : 'flex items-center justify-between'} text-sm`}>
                          <span className="text-gray-600 font-semibold">
                            🎯 Benar: <span className="text-green-600 font-bold">{item.jawaban_benar || 0}/{item.total_soal || 0}</span>
                          </span>
                          <span className="text-gray-600 font-semibold">
                            ⏱️ Waktu: <span className="text-blue-600 font-bold">
                              {item.waktu_pengerjaan ? `${Math.floor(item.waktu_pengerjaan / 60)}:${String(item.waktu_pengerjaan % 60).padStart(2, '0')}` : '-'}
                            </span>
                          </span>
                          {isTopThree && item.completed_at && (
                            <span className="text-gray-600 font-semibold col-span-2">
                              📅 Selesai: <span className="text-gray-700 font-bold">
                                {new Date(item.completed_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Reset Confirmation Popup */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-4 border-orange-200 transform transition-all">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                <RotateCcw className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">
                Reset Leaderboard?
              </h2>
              <p className="text-gray-600 font-medium">
                Semua data peringkat akan dihapus permanen. Tindakan ini tidak dapat dibatalkan!
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-semibold">⚠️ {error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setError(null);
                }}
                disabled={resetting}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleResetLeaderboard}
                disabled={resetting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Mereset...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5" />
                    Ya, Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
