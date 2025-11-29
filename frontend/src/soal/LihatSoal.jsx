import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiService } from "../services/api";

export default function LihatSoal() {
  const { kategori } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [soalList, setSoalList] = useState([]);
  const [materiName, setMateriName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSoalFromAPI = async () => {
      try {
        console.log("📖 LihatSoal - Loading soal dari API");
        
        // Get materi_id from location state (passed from KumpulanMateri)
        const stateData = location.state;
        
        if (!stateData || !stateData.materi_id) {
          console.error("❌ Materi ID tidak ditemukan di state");
          setLoading(false);
          return;
        }

        console.log("📖 State data:", stateData);
        setMateriName(stateData.materi);

        // Fetch soal by materi_id from API
        const response = await apiService.getSoalByMateri(stateData.materi_id);
        
        if (response.status === "success" && response.data && response.data.soal_list) {
          const soalFromAPI = response.data.soal_list;
          console.log("📖 Soal from API:", soalFromAPI.length);
          
          // Set PIN code dari response
          if (response.data.pin_code) {
            setPinCode(response.data.pin_code);
            console.log("📌 PIN Code:", response.data.pin_code);
          }
          
          if (soalFromAPI.length > 0) {
            // Transform backend format to frontend format
            const transformedSoal = soalFromAPI.map(s => {
              // Determine jenis soal: jika ada pilihan_a dan pilihan_b, maka pilihan_ganda
              const isPilihanGanda = (s.pilihan_a && s.pilihan_b) ? true : false;
              const jenisSoal = isPilihanGanda ? "pilihan_ganda" : "isian";
              
              // Parse jawaban_benar dan variasi_jawaban untuk isian singkat
              let jawabanBenar = s.jawaban_benar || "";
              if (!isPilihanGanda && s.variasi_jawaban) {
                try {
                  jawabanBenar = typeof s.variasi_jawaban === 'string' 
                    ? JSON.parse(s.variasi_jawaban) 
                    : s.variasi_jawaban;
                } catch (e) {
                  console.log('⚠️ Failed to parse variasi_jawaban:', e);
                  jawabanBenar = Array.isArray(s.jawaban_benar) ? s.jawaban_benar : [s.jawaban_benar];
                }
              }
              
              return {
                pertanyaan: s.pertanyaan,
                pilihanA: s.pilihan_a || "",
                pilihanB: s.pilihan_b || "",
                pilihanC: s.pilihan_c || "",
                pilihanD: s.pilihan_d || "",
                jawabanBenar: jawabanBenar,
                jenis: jenisSoal,
                gambar: s.gambar || null // Load gambar dari backend
              };
            });
            
            console.log("📖 Transformed soal:", transformedSoal);
            setSoalList(transformedSoal);
          } else {
            console.log("❌ Tidak ada soal ditemukan untuk materi ini");
          }
        } else {
          console.log("❌ Gagal mengambil soal dari API:", response.message);
        }
      } catch (error) {
        console.error("❌ Error loading soal:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSoalFromAPI();
  }, [kategori, location.state]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-orange-200">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading soal...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!materiName && soalList.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative z-10 p-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate("/halaman-awal-kreator")}
              className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white hover:shadow-lg transition-all font-semibold text-gray-700 border-2 border-orange-200"
            >
              <ArrowLeft size={20} />
              Kembali
            </button>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border-2 border-orange-200">
              <div className="text-orange-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-700 font-bold text-lg mb-2">Tidak ada soal untuk ditampilkan</p>
              <p className="text-sm text-gray-600">Materi ini belum memiliki soal</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header - Style seperti Profil */}
          <div className="py-6 flex items-center justify-center mb-6">
            <button
              onClick={() => navigate("/halaman-awal-kreator")}
              className="absolute top-6 left-6 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white hover:shadow-lg transition-all font-semibold text-gray-700 border-2 border-orange-200"
            >
              ← Kembali
            </button>

            <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              👁️ Lihat Soal
            </h1>
          </div>

          {/* Info Materi */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border-2 border-orange-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{materiName}</h2>
                <p className="text-gray-600 font-medium">📝 Total: {soalList.length} soal</p>
              </div>
              
              {/* PIN Display */}
              {pinCode && (
                <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl p-4 shadow-lg border-2 border-orange-300 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <p className="text-white text-sm font-semibold">PIN Kuis</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 mt-2">
                    <p className="text-2xl font-bold text-center text-orange-600 tracking-wider">
                      {pinCode}
                    </p>
                  </div>
                  <p className="text-white text-xs mt-2 text-center">
                    Bagikan PIN ini ke peserta
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Daftar Soal */}
          <div className="space-y-4">
            {soalList.map((soal, idx) => {
              const jenisSoal = soal.jenis || "pilihan_ganda";
              
              return (
                <div key={idx} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-orange-100">
                  {/* Pertanyaan */}
                  <div className="mb-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                        {idx + 1}
                      </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-lg font-semibold text-gray-800">{soal.pertanyaan || soal.soal}</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          jenisSoal === "pilihan_ganda" ? "bg-orange-100 text-orange-700" :
                          jenisSoal === "isian" ? "bg-green-100 text-green-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {jenisSoal === "pilihan_ganda" ? "Pilihan Ganda" :
                           jenisSoal === "isian" ? "Isian Singkat" : "Essay"}
                        </span>
                      </div>
                      {soal.gambar && (
                        <img 
                          src={soal.gambar} 
                          alt="Gambar soal" 
                          className="mt-2 max-w-md w-full rounded-lg border-2 border-orange-200 shadow-md" 
                          onLoad={() => console.log('✅ Gambar lihat soal dimuat untuk soal', idx + 1)}
                          onError={(e) => {
                            console.error('❌ Gagal memuat gambar lihat soal', idx + 1);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Konten berdasarkan jenis soal */}
                <div className="ml-11">
                  {jenisSoal === "pilihan_ganda" && (
                    <>
                      {/* Pilihan Jawaban */}
                      <div className="space-y-2">
                        {["A", "B", "C", "D"].map((option) => {
                          const pilihan = soal[`pilihan${option}`] || soal.opsi?.[option.charCodeAt(0) - 65];
                          if (!pilihan) return null;
                          
                          const isCorrect = soal.jawabanBenar === option || soal.jawabanHuruf === option;
                          return (
                            <div
                              key={option}
                              className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                                isCorrect
                                  ? "bg-green-50 border-green-500"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
                                  isCorrect
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {option}
                              </div>
                              <p className={`flex-1 ${isCorrect ? "font-semibold text-green-800" : "text-gray-700"}`}>
                                {pilihan}
                              </p>
                              {isCorrect && (
                                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Jawaban Benar Label */}
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-green-700 font-semibold">
                          Jawaban Benar: {soal.jawabanBenar || soal.jawabanHuruf}
                        </span>
                      </div>
                    </>
                  )}

                  {(jenisSoal === "isian" || jenisSoal === "essay") && (
                    <>
                      {/* Jawaban untuk isian/essay */}
                      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-700 mb-2">
                              {jenisSoal === "isian" && Array.isArray(soal.jawabanBenar) 
                                ? "Jawaban yang Diterima (salah satu):" 
                                : "Jawaban yang Benar:"}
                            </p>
                            {Array.isArray(soal.jawabanBenar) ? (
                              // Multiple jawaban untuk isian
                              <div className="space-y-1">
                                {soal.jawabanBenar.map((jawab, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                    </span>
                                    <p className="text-gray-800">{jawab}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Single jawaban untuk essay atau old format
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {soal.jawabanBenar}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
