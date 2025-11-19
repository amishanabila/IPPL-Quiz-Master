import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { apiService } from "./services/api";

export default function HalamanAwalPeserta() {
  const navigate = useNavigate();
  const [step, setStep] = useState("pin"); // "pin" atau "nama"
  const [pin, setPin] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const [quizData, setQuizData] = useState(null); // 🔥 quiz data from backend

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setErrors("");

    // Validasi PIN - HARUS 6 DIGIT
    if (!pin || pin.trim() === "") {
      setErrors("PIN wajib diisi");
      return;
    }

    // Remove spaces and check
    const cleanPin = pin.replace(/\s+/g, "");

    if (cleanPin.length !== 6) {
      setErrors("PIN harus tepat 6 digit angka");
      return;
    }

    // Validasi PIN format (hanya angka)
    if (!/^\d{6}$/.test(cleanPin)) {
      setErrors("PIN harus 6 digit angka");
      return;
    }

    setLoading(true);

    try {
      // Validasi PIN via API backend
      const response = await apiService.validatePin(cleanPin);

      if (response.status === "success") {
        setQuizData(response.data);
        setStep("nama");
        setErrors("");
      } else {
        setErrors(response.message || "PIN tidak valid atau quiz tidak ditemukan");
      }
    } catch (error) {
      console.error("Error validating PIN:", error);
      setErrors("Terjadi kesalahan saat memvalidasi PIN. Pastikan backend sudah running.");
    } finally {
      setLoading(false);
    }
  };

  const handleNamaSubmit = async (e) => {
    e.preventDefault();
    setErrors("");

    // Validasi nama
    if (!nama || nama.trim() === "") {
      setErrors("Nama wajib diisi");
      return;
    }

    if (nama.length < 2) {
      setErrors("Nama minimal 2 karakter");
      return;
    }

    // Validasi nama format (hanya huruf dan spasi)
    if (!/^[A-Za-z\s]+$/.test(nama)) {
      setErrors("Nama hanya boleh berisi huruf dan spasi");
      return;
    }

    setLoading(true);

    try {
      const cleanPin = pin.replace(/\s+/g, '');

      // Generate slug dari judul materi (bukan dari PIN)
      const materiName = quizData.judul || quizData.materi;
      const slug = materiName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      console.log("🎯 Peserta - Redirect ke soal:", materiName);
      console.log("🎯 Peserta - Slug:", slug);
      console.log("🎯 Peserta - Quiz data:", quizData);
      
      setLoading(false);
      navigate(`/soal/${slug}`, { state: { pin: cleanPin, nama: nama.trim(), quizData, isPeserta: true } });
    } catch (error) {
      console.error("Error:", error);
      setErrors("Terjadi kesalahan, silakan coba lagi");
      setLoading(false);
    }
  };

  const handleBackToPinStep = () => {
    setStep("pin");
    setNama("");
    setErrors("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 flex flex-col relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="flex items-center justify-center flex-1 p-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg border-4 border-white/50 transform transition-all duration-300">
          {step === "pin" ? (
            // Step 1: PIN Input
            <>
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl mb-4">
                  <span className="text-6xl">🔐</span>
                </div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 mb-2">Ikuti Quiz</h1>
                <p className="text-gray-600 font-medium">Masukkan PIN yang diberikan oleh guru</p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handlePinSubmit}>
                <div className="flex flex-col">
                  <label htmlFor="pin" className="mb-3 font-bold text-gray-700 flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    Masukkan PIN (6 digit):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="pin"
                      placeholder="123456"
                      value={pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // hanya angka
                        if (value.length <= 6) {
                          setPin(value);
                        }
                      }}
                      maxLength={6}
                      disabled={loading}
                      className={`w-full border-3 rounded-2xl px-4 py-5 text-center text-3xl font-mono font-black tracking-[0.5em] bg-gradient-to-br from-yellow-50 to-orange-50 focus:outline-none focus:ring-4 transition-all duration-300 shadow-lg ${
                        errors ? "border-red-500 focus:ring-red-300" : "border-orange-300 focus:ring-orange-200 focus:border-orange-500"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 px-1">
                    <p className="text-sm text-gray-500 font-semibold">
                      {pin.length}/6 digit
                    </p>
                    {pin.length === 6 && (
                      <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                        ✓ Lengkap
                      </span>
                    )}
                  </div>
                  {errors && (
                    <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
                      <span className="text-red-500 text-lg">⚠️</span>
                      <p className="text-red-600 text-sm font-semibold flex-1">{errors}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl w-full flex justify-center items-center text-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <span className="relative flex items-center gap-2">
                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                      <>
                        <span>Lanjutkan</span>
                        <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                      </>
                    )}
                  </span>
                </button>
              </form>
            </>
          ) : (
            // Step 2: Nama Input
            <>
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4 animate-bounce">
                  <span className="text-6xl">👋</span>
                </div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">Selamat Datang!</h1>
                <p className="text-gray-600 font-medium">Silakan masukkan nama Anda</p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleNamaSubmit}>
                <div className="flex flex-col">
                  <label htmlFor="nama" className="mb-3 font-bold text-gray-700 flex items-center gap-2">
                    <span className="text-xl">✍️</span>
                    Nama Lengkap:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="nama"
                      placeholder="Masukkan nama Anda"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      disabled={loading}
                      className={`w-full border-3 rounded-2xl px-5 py-4 text-lg font-semibold bg-gradient-to-br from-yellow-50 to-orange-50 focus:outline-none focus:ring-4 transition-all duration-300 shadow-lg ${
                        errors ? "border-red-500 focus:ring-red-300" : "border-green-300 focus:ring-green-200 focus:border-green-500"
                      }`}
                    />
                  </div>
                  {nama.length > 0 && (
                    <p className="text-sm text-gray-500 font-semibold mt-2 px-1">
                      {nama.length} karakter
                    </p>
                  )}
                  {errors && (
                    <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
                      <span className="text-red-500 text-lg">⚠️</span>
                      <p className="text-red-600 text-sm font-semibold flex-1">{errors}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackToPinStep}
                    disabled={loading}
                    className="group flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <span className="relative flex items-center gap-2">
                      <span className="transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
                      <span>Kembali</span>
                    </span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex-1 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex justify-center items-center gap-2 text-lg overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <span className="relative flex items-center gap-2">
                      {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <>
                          <span className="text-xl">🚀</span>
                          <span>Mulai</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
