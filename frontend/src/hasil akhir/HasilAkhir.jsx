import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function HasilAkhir() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    console.log('🎯 ========== HASIL AKHIR COMPONENT MOUNTED ==========');
    console.log('📍 Location state:', location.state);
    console.log('📍 Has hasil in state:', !!location.state?.hasil);
    
    // Ambil dari state route jika ada
    if (location.state && location.state.hasil) {
      console.log('✅ Loading hasil from location.state');
      console.log('📊 Hasil data:', {
        materi: location.state.hasil.materi,
        kategori: location.state.hasil.kategori,
        soalCount: location.state.hasil.soalList?.length,
        jawabanCount: Object.keys(location.state.hasil.jawabanUser || {}).length,
        skor: location.state.hasil.skor
      });
      setHasil(location.state.hasil);
      console.log('✅ Hasil loaded successfully from location.state');
    } else {
      console.log('⚠️ No hasil in location.state, checking localStorage...');
      // Ambil dari localStorage sebagai fallback
      const data = localStorage.getItem("hasilQuiz");
      console.log('💾 localStorage data exists:', !!data);
      
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          console.log('✅ Loaded hasil from localStorage (fallback)');
          console.log('📊 Parsed data:', {
            materi: parsedData.materi,
            kategori: parsedData.kategori,
            soalCount: parsedData.soalList?.length,
            jawabanCount: Object.keys(parsedData.jawabanUser || {}).length,
            skor: parsedData.skor
          });
          setHasil(parsedData);
        } catch (error) {
          console.error('❌ Error parsing localStorage data:', error);
          console.error('❌ Raw data:', data.substring(0, 100) + '...');
        }
      } else {
        console.error('❌ No hasil data found in location.state or localStorage');
      }
    }
    console.log('🎯 ========================================');
  }, [location.state]);

  // Cleanup function to remove hasil from localStorage when leaving this page
  useEffect(() => {
    return () => {
      // Only clean up when navigating away from results page
      if (hasil) {
        localStorage.removeItem('hasilQuiz');
        console.log('🧹 Cleaned up localStorage on unmount');
      }
    };
  }, [hasil]);

  if (!hasil) {
    console.error('❌ ========== NO HASIL DATA - SHOWING ERROR PAGE ==========');
    console.error('❌ location.state:', location.state);
    console.error('❌ localStorage hasilQuiz:', localStorage.getItem('hasilQuiz')?.substring(0, 100));
    console.error('❌ Possible reasons:');
    console.error('   1. Data not passed from Soal.jsx');
    console.error('   2. localStorage failed to save');
    console.error('   3. Direct navigation without completing quiz');
    console.error('❌ =====================================================');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border-4 border-orange-300 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">Tidak Ada Hasil</h1>
          <p className="text-center text-gray-600 mb-6 font-medium">Tidak ada hasil quiz ditemukan. Silakan kerjakan quiz terlebih dahulu.</p>
          <p className="text-center text-gray-500 mb-4 text-sm">Periksa console browser (F12) untuk detail error.</p>
          <button
            onClick={() => {
              localStorage.removeItem('hasilQuiz');
              console.log('🧹 Cleaned up localStorage before navigate');
              navigate("/");
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const { soalList, jawabanUser, materi, kategori, skor: skorFromData, benar: benarFromData, total: totalFromData } = hasil;

  console.log('📊 ========== CALCULATING HASIL AKHIR ==========');
  console.log('📊 Materi:', materi);
  console.log('📊 Kategori:', kategori);
  console.log('📊 Soal count:', soalList?.length);
  console.log('📊 Jawaban count:', Object.keys(jawabanUser || {}).length);
  console.log('📊 Pre-calculated skor:', skorFromData);
  console.log('📊 Pre-calculated benar:', benarFromData);

  // Hitung skor → PG dan isian/essay jika jawaban cocok kunci
  const benar = soalList.filter((soal) => {
    const userAnswer = jawabanUser[soal.id];
    const correctAnswer = soal.jawaban;
    
    // Validasi: jawaban user dan jawaban benar harus ada dan tidak kosong
    if (!userAnswer || !correctAnswer) return false;
    
    // Validasi: jawaban tidak boleh hanya berisi karakter spesial atau whitespace
    const cleanUserAnswer = userAnswer.trim();
    if (!cleanUserAnswer || cleanUserAnswer === '-' || cleanUserAnswer.length === 0) return false;
    
    if (soal.jenis === "pilihan_ganda") {
      return userAnswer === correctAnswer;
    }
    
    // Untuk isian singkat dengan multiple jawaban
    if (soal.jenis === "isian" && Array.isArray(correctAnswer)) {
      const normalizedUserAnswer = cleanUserAnswer.toLowerCase();
      return correctAnswer.some(jawab => {
        const normalizedCorrectAnswer = jawab?.trim().toLowerCase();
        return normalizedCorrectAnswer && normalizedUserAnswer === normalizedCorrectAnswer;
      });
    }
    
    // Single jawaban (essay atau old format)
    const normalizedCorrectAnswer = correctAnswer?.trim();
    if (!normalizedCorrectAnswer) return false; // Jawaban benar tidak boleh kosong
    
    return cleanUserAnswer === normalizedCorrectAnswer;
  }).length;

  const total = soalList.length;
  const persentase = Math.round((benar / total) * 100);

  console.log('✅ Calculated benar:', benar, 'dari', total);
  console.log('📊 Persentase:', persentase + '%');
  console.log('📊 ==========================================');

  // Tentukan grade dan pesan
  let grade = "";
  let gradeColor = "";
  let gradeEmoji = "";
  let message = "";

  if (persentase >= 90) {
    grade = "A";
    gradeColor = "from-green-500 to-emerald-600";
    gradeEmoji = "🏆";
    message = "Luar Biasa! Sempurna!";
  } else if (persentase >= 80) {
    grade = "B+";
    gradeColor = "from-blue-500 to-cyan-600";
    gradeEmoji = "⭐";
    message = "Bagus Sekali!";
  } else if (persentase >= 70) {
    grade = "B";
    gradeColor = "from-indigo-500 to-purple-600";
    gradeEmoji = "👍";
    message = "Cukup Baik!";
  } else if (persentase >= 60) {
    grade = "C";
    gradeColor = "from-yellow-500 to-orange-500";
    gradeEmoji = "💪";
    message = "Terus Belajar!";
  } else {
    grade = "D";
    gradeColor = "from-orange-500 to-red-500";
    gradeEmoji = "📚";
    message = "Jangan Menyerah!";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 py-8 px-4 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Card dengan Score */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-6 border-t-8 border-orange-500">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 mb-2">
              Hasil Quiz
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-600 font-semibold">
              <span className="px-3 py-1 bg-orange-100 rounded-full text-orange-700">{kategori}</span>
              <span>•</span>
              <span>{materi}</span>
            </div>
          </div>

          {/* Score Circle */}
          <div className="flex flex-col items-center mb-6">
            <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${gradeColor} flex flex-col items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110`}>
              <div className="text-7xl mb-2">{gradeEmoji}</div>
              <div className="text-6xl font-black text-white">{grade}</div>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-4">{message}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border-2 border-green-200">
              <div className="text-3xl font-black text-green-600">{benar}</div>
              <div className="text-sm font-semibold text-green-700">Benar</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center border-2 border-red-200">
              <div className="text-3xl font-black text-red-600">{total - benar}</div>
              <div className="text-sm font-semibold text-red-700">Salah</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl p-4 text-center border-2 border-orange-200">
              <div className="text-3xl font-black text-orange-600">{persentase}%</div>
              <div className="text-sm font-semibold text-orange-700">Skor</div>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-3xl">📝</span>
            <span>Review Jawaban</span>
          </h2>
          <div className="space-y-4">
            {soalList.map((soal, index) => {
              // Format jawaban benar untuk ditampilkan
              let jawabanBenar;
              if (Array.isArray(soal.jawaban)) {
                jawabanBenar = soal.jawaban.filter(j => j && j.trim() && j.trim() !== '-').join(" / ");
              } else if (soal.jawaban && soal.jawaban.trim() && soal.jawaban.trim() !== '-') {
                jawabanBenar = soal.jawaban;
              } else {
                jawabanBenar = "(Jawaban tidak tersedia)";
              }
              
              const jawabanKamu = jawabanUser[soal.id] || "(Tidak dijawab)";
              
              let isCorrect = false;
              
              // Get clean values
              const cleanUserAnswer = jawabanKamu?.trim();
              const correctAnswer = soal.jawaban;
              
              // Check if valid answers exist
              const hasValidUserAnswer = cleanUserAnswer && cleanUserAnswer !== '-' && cleanUserAnswer.length > 0;
              const hasValidCorrectAnswer = correctAnswer && 
                (Array.isArray(correctAnswer) ? correctAnswer.length > 0 : (correctAnswer.trim() !== '' && correctAnswer.trim() !== '-'));
              
              // Calculate isCorrect
              if (!hasValidUserAnswer) {
                isCorrect = false; // User didn't answer or answered with invalid value
              } else if (!hasValidCorrectAnswer) {
                isCorrect = false; // No valid correct answer in database
              } else if (soal.jenis === "pilihan_ganda") {
                isCorrect = jawabanKamu === correctAnswer;
              } else if (soal.jenis === "isian" && Array.isArray(correctAnswer)) {
                // Check if user answer matches any of the accepted answers
                const normalizedUserAnswer = cleanUserAnswer.toLowerCase();
                isCorrect = correctAnswer.some(jawab => {
                  const normalizedCorrectAnswer = jawab?.trim().toLowerCase();
                  return normalizedCorrectAnswer && normalizedCorrectAnswer !== '-' && normalizedUserAnswer === normalizedCorrectAnswer;
                });
              } else {
                // Single answer validation
                const normalizedCorrectAnswer = correctAnswer?.trim();
                isCorrect = normalizedCorrectAnswer && normalizedCorrectAnswer !== '-' && cleanUserAnswer === normalizedCorrectAnswer;
              }

              return (
                <div
                  key={soal.id}
                  className={`border-2 rounded-xl p-5 shadow-md transition-all duration-200 ${
                    isCorrect 
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300" 
                      : "bg-gradient-to-r from-red-50 to-pink-50 border-red-300"
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-md ${
                      isCorrect 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
                        : "bg-gradient-to-br from-red-500 to-pink-600 text-white"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-lg leading-relaxed">
                        {soal.soal}
                      </p>
                      {soal.gambar && (
                        <img
                          src={soal.gambar}
                          alt="Soal"
                          className="mt-3 w-48 h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                          onLoad={() => console.log('✅ Gambar hasil akhir berhasil dimuat')}
                          onError={(e) => {
                            console.error('❌ Gagal memuat gambar hasil akhir');
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-md ${
                      isCorrect 
                        ? "bg-green-500 text-white" 
                        : "bg-red-500 text-white"
                    }`}>
                      {isCorrect ? "✅ Benar" : "❌ Salah"}
                    </div>
                  </div>

                  {/* Answers */}
                  <div className="space-y-3 ml-13">
                    <div className={`p-4 rounded-lg border-2 ${
                      isCorrect 
                        ? "bg-white border-green-300" 
                        : "bg-white border-red-300"
                    }`}>
                      <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isCorrect ? "bg-green-500" : "bg-red-500"}`}></span>
                        Jawaban Kamu:
                      </p>
                      <p className={`font-bold text-lg ${
                        isCorrect ? "text-green-700" : "text-red-700"
                      }`}>
                        {jawabanKamu}
                      </p>
                    </div>

                    {/* Tampilkan jawaban benar HANYA jika user salah DAN jawaban benar tersedia */}
                    {!isCorrect && jawabanBenar && jawabanBenar !== "(Jawaban tidak tersedia)" && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300">
                        <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Jawaban Benar:
                        </p>
                        <p className="font-bold text-lg text-green-700">
                          {jawabanBenar}
                        </p>
                      </div>
                    )}
                    
                    {/* Peringatan jika jawaban benar tidak tersedia di database */}
                    {!isCorrect && (!jawabanBenar || jawabanBenar === "(Jawaban tidak tersedia)") && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
                        <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-2">
                          <span className="text-xl">⚠️</span>
                          <span>Perhatian:</span>
                        </p>
                        <p className="font-medium text-sm text-orange-700">
                          Jawaban benar tidak tersedia untuk soal ini. Silakan hubungi pembuat quiz.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              localStorage.removeItem('hasilQuiz');
              console.log('🧹 Cleaned up localStorage before navigate');
              navigate("/");
            }}
            className="px-8 py-4 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105 text-lg"
          >
            🏠 Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
