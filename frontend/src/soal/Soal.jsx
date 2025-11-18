import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SoalBelumTersedia from "./SoalBelumTersedia";
import { apiService } from "../services/api";

export default function Soal() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fromSlug = (text) =>
    text.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const materiSlug = fromSlug(slug);
  console.log("🔍 Debug - URL slug:", slug);
  console.log("🔍 Debug - Materi dari slug:", materiSlug);

  const [soalListRandom, setSoalListRandom] = useState([]);
  const [materi, setMateri] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawabanUser, setJawabanUser] = useState({});
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const soalAktif = soalListRandom[currentIndex];

  // --- TIMER GLOBAL 60 DETIK ---
  const TOTAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  // Load soal from API on mount
  useEffect(() => {
    const loadSoalFromAPI = async () => {
      try {
        console.log("🔍 Loading soal dari API");
        console.log("🔍 Location state:", location.state);
        console.log("🔍 URL slug:", slug);
        
        // Get materi data from location state OR fetch from API using slug
        const stateData = location.state;
        let materiId = stateData?.materi_id;
        
        // If no state, fetch materi list and find matching materi by judul
        if (!materiId) {
          console.log("⚠️ No materi_id in state, fetching from API...");
          try {
            const materiResponse = await apiService.getMateri();
            if (materiResponse.status === "success" && materiResponse.data) {
              const allMateri = materiResponse.data;
              const matchingMateri = allMateri.find(m => {
                const materiSlugFromDb = m.judul.toLowerCase().replace(/\s+/g, '-');
                return materiSlugFromDb === slug.toLowerCase();
              });
              
              if (matchingMateri) {
                materiId = matchingMateri.materi_id;
                console.log("✅ Found matching materi:", matchingMateri);
                setMateri({
                  materi: matchingMateri.judul,
                  kategori: matchingMateri.nama_kategori || "Kategori"
                });
              } else {
                console.error("❌ Materi tidak ditemukan dengan slug:", slug);
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error("❌ Error fetching materi:", err);
            setLoading(false);
            return;
          }
        } else {
          console.log("✅ Using materi_id from state:", materiId);
          setMateri({
            materi: stateData.materi,
            kategori: stateData.kategori
          });
        }

        if (!materiId) {
          console.error("❌ Materi ID tidak ditemukan");
          setLoading(false);
          return;
        }

        // Fetch soal from API
        console.log("🔍 Fetching soal for materi_id:", materiId);
        const response = await apiService.getSoalByMateri(materiId);
        console.log("📦 API Response:", response);
        console.log("📦 Response data:", response.data);
        console.log("📦 Soal list:", response.data?.soal_list);
        
        if (response.status === "success" && response.data && response.data.soal_list) {
          const soalFromAPI = response.data.soal_list;
          console.log("✅ Loaded soal from API:", soalFromAPI.length);
          console.log("✅ First soal:", soalFromAPI[0]);
          
          if (soalFromAPI.length > 0) {
            // Transform backend format to frontend format and shuffle
            const transformedSoal = soalFromAPI.map((s, idx) => ({
              id: s.soal_id || idx,
              soal: s.pertanyaan,  // ✅ FIXED: use 'soal' field for consistency
              pertanyaan: s.pertanyaan,
              opsi: [s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d].filter(Boolean),
              jawaban: s.jawaban_benar,
              jenis: "pilihan_ganda",
              gambar: null // TODO: Add gambar support
            }));
            
            // Shuffle soal
            const shuffled = transformedSoal.sort(() => Math.random() - 0.5);
            console.log("✅ Soal shuffled:", shuffled.length);
            console.log("✅ Shuffled soal:", shuffled);
            setSoalListRandom(shuffled);
            console.log("✅ State soalListRandom updated");
          } else {
            console.log("❌ soalFromAPI length is 0");
          }
        } else {
          console.log("❌ Tidak ada soal ditemukan");
          console.log("❌ Response status:", response.status);
          console.log("❌ Response data:", response.data);
        }
      } catch (error) {
        console.error("❌ Error loading soal:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSoalFromAPI();
  }, [location.state, slug]); // Add slug to dependencies

  // Timer effect
  useEffect(() => {
    if (soalListRandom.length === 0 || loading) return;

    if (timeLeft <= 0) {
      localStorage.setItem(
        "hasilQuiz",
        JSON.stringify({
          materi: materiSlug,
          kategori: materi?.kategori,
          soalList: soalListRandom,
          jawabanUser,
        })
      );
      navigate("/hasil-akhir");
      return;
    }

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate, jawabanUser, materiSlug, materi, soalListRandom, loading]);

  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (timeLeft / TOTAL_TIME) * circumference;

  const pilihJawaban = (opsi) => {
    const newJawaban = { ...jawabanUser, [soalAktif.id]: opsi };
    setJawabanUser(newJawaban);
    console.log("✅ Jawaban dipilih:", opsi, "untuk soal ID:", soalAktif.id);
  };

  const handleNext = () => {
    if (currentIndex < soalListRandom.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Soal terakhir, tampilkan popup konfirmasi
      setShowConfirmPopup(true);
    }
  };

  const handleSelesai = () => {
    localStorage.setItem(
      "hasilQuiz",
      JSON.stringify({
        materi: materiSlug,
        kategori: materi?.kategori,
        soalList: soalListRandom,
        jawabanUser,
      })
    );
    navigate("/hasil-akhir");
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 flex items-center justify-center">
        <div className="text-gray-700 font-semibold">Loading soal...</div>
      </div>
    );
  }

  // Show empty state if no soal
  if (soalListRandom.length === 0) {
    return <SoalBelumTersedia />;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header Bar */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-20 border-b-4 border-orange-500">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          
          {/* Judul di Header */}
          {materi && soalListRandom.length > 0 && (
            <div className="flex-1 text-center mx-4">
              <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">{materi.materi}</h1>
              <p className="text-sm text-gray-600 font-semibold">{materi.kategori}</p>
            </div>
          )}
          
          {/* Timer di Header */}
          {soalListRandom.length > 0 && (
            <div className="flex items-center gap-3">
              <svg height={radius * 2} width={radius * 2} className={timeLeft <= 10 ? "animate-pulse" : ""}>
                <circle
                  stroke="#e5e7eb"
                  fill="white"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  stroke={timeLeft <= 10 ? "#ef4444" : "#f97316"}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{
                    strokeDashoffset,
                    transition: "stroke-dashoffset 1s linear",
                    filter: timeLeft <= 10 ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))" : "drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))"
                  }}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className={`text-lg font-bold ${timeLeft <= 10 ? "fill-red-600" : "fill-orange-600"}`}
                >
                  {timeLeft}s
                </text>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {soalListRandom.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm shadow-md py-3 px-4 border-b relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Soal {currentIndex + 1} dari {soalListRandom.length}</span>
              <span className="text-sm font-semibold text-orange-600">{Math.round((currentIndex + 1) / soalListRandom.length * 100)}% Selesai</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-400 via-yellow-400 to-green-400 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentIndex + 1) / soalListRandom.length) * 100}%` }}
              >
                <div className="h-full bg-white opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Soal atau pesan */}
      <div className="flex-grow flex items-center justify-center p-6 relative z-10">
        {soalAktif ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-orange-200 w-full max-w-4xl transform transition-all duration-300 hover:shadow-3xl">
            {/* Question Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                  {currentIndex + 1}
                </div>
                <p className="text-lg font-bold text-gray-800 leading-relaxed flex-1">
                  {soalAktif.soal}
                </p>
              </div>
            </div>
            
            {/* Gambar jika ada */}
            {soalAktif.gambar && (
              <div className="mb-6 flex justify-center">
                <img
                  src={soalAktif.gambar}
                  alt="Soal"
                  className="max-w-md w-full rounded-xl border-4 border-orange-200 shadow-lg"
                  onLoad={() => console.log('✅ Gambar soal berhasil dimuat')}
                  onError={(e) => {
                    console.error('❌ Gagal memuat gambar soal');
                    console.error('Src length:', soalAktif.gambar?.length);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {soalAktif.opsi?.length > 0 ? (
              <div className="space-y-3 mb-8">
                {soalAktif.opsi.map((opsi, index) => {
                  const huruf = String.fromCharCode(65 + index);
                  const isSelected = jawabanUser[soalAktif.id] === opsi;
                  return (
                    <div
                      key={index}
                      onClick={() => pilihJawaban(opsi)}
                      className={`group flex items-center gap-4 border-2 rounded-xl px-5 py-4 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-orange-400 to-yellow-400 border-orange-500 shadow-lg transform scale-[1.02]"
                          : "bg-white border-gray-300 hover:border-orange-400 hover:shadow-md hover:scale-[1.01]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-md ${
                        isSelected 
                          ? "bg-white text-orange-600" 
                          : "bg-gradient-to-br from-orange-100 to-yellow-100 text-orange-600 group-hover:from-orange-200 group-hover:to-yellow-200"
                      }`}>
                        {huruf}
                      </div>
                      <span className={`font-medium text-base flex-1 ${
                        isSelected ? "text-white" : "text-gray-800 group-hover:text-orange-600"
                      }`}>
                        {opsi}
                      </span>
                      {isSelected && (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-8">
                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Tulis Jawaban Anda</span>
                </label>
                <textarea
                  className="w-full border-2 border-gray-300 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-medium text-gray-700 resize-none"
                  rows="5"
                  placeholder="Ketik jawaban Anda di sini... (Minimal 10 karakter)"
                  value={jawabanUser[soalAktif.id] || ""}
                  onChange={(e) =>
                    setJawabanUser({
                      ...jawabanUser,
                      [soalAktif.id]: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {(jawabanUser[soalAktif.id] || "").length} karakter
                </p>
              </div>
            )}

            <div className="flex justify-between items-center gap-4 pt-6 border-t-2 border-gray-100">
              {currentIndex > 0 ? (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Sebelumnya</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 ${
                  currentIndex === soalListRandom.length - 1
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    : "bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600"
                } text-white`}
              >
                <span className="text-lg">
                  {currentIndex === soalListRandom.length - 1 ? "🎉 Selesai" : "Selanjutnya"}
                </span>
                {currentIndex < soalListRandom.length - 1 && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : (
          <SoalBelumTersedia />
        )}
      </div>

      {/* Popup Konfirmasi Selesai */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-orange-300 transform transition-all duration-300 animate-scaleIn">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-5xl">✋</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 mb-3">
              Konfirmasi Selesai
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6 font-medium">
              Apakah Anda yakin telah selesai mengerjakan semua soal? Pastikan semua jawaban sudah terisi dengan benar.
            </p>

            {/* Info */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-2xl">ℹ️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-800 mb-1">Informasi:</p>
                  <p className="text-xs text-orange-700">
                    Setelah Anda klik "Ya, Selesai", jawaban tidak dapat diubah lagi dan akan langsung diperiksa.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105"
              >
                Periksa Lagi
              </button>
              <button
                onClick={handleSelesai}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105"
              >
                ✓ Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
