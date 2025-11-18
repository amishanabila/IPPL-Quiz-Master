// src/pages/BuatSoal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormBuatSoal from "../buat soal/FormBuatSoal";
import { kategoriList } from "../kategori/Kategori";
import Footer from "../footer/Footer";
import { Loader2, Copy, Check } from "lucide-react"; // Loader icon
import { apiService } from "../services/api";

export default function BuatSoal() {
  const navigate = useNavigate();
  const [kategori, setKategori] = useState("");
  const [kategoriCustom, setKategoriCustom] = useState("");
  const [showKategoriInput, setShowKategoriInput] = useState(false);
  const [materi, setMateri] = useState("");
  const [jumlahSoal, setJumlahSoal] = useState(1);
  const [soalList, setSoalList] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // 🔥 loading state
  const [pinCode, setPinCode] = useState(""); // 🔥 PIN code state
  const [copied, setCopied] = useState(false); // 🔥 copy state
  const [isEditMode, setIsEditMode] = useState(false); // 🔥 edit mode state
  const [kategoriFromAPI, setKategoriFromAPI] = useState([]); // kategori from API

  // Load kategori from API
  React.useEffect(() => {
    const loadKategori = async () => {
      try {
        const response = await apiService.getKategori();
        if (response.status === "success" && response.data) {
          setKategoriFromAPI(response.data);
          console.log("✅ Loaded kategori from API:", response.data.length);
        }
      } catch (error) {
        console.error("❌ Error loading kategori:", error);
      }
    };
    loadKategori();
  }, []);

  // Load data untuk edit mode
  React.useEffect(() => {
    const editData = sessionStorage.getItem("editMateri");
    if (editData) {
      try {
        const materiData = JSON.parse(editData);
        setKategori(materiData.kategori);
        setMateri(materiData.materi);
        setIsEditMode(true);

        // Load soal yang sudah ada
        const allSoal = JSON.parse(localStorage.getItem("soal")) || {};
        const existingSoal = allSoal[materiData.materi] || [];
        
        if (existingSoal.length > 0) {
          // Normalize soal structure untuk edit
          const normalizedSoal = existingSoal.map(s => ({
            ...s,
            // Ensure jawaban structure is correct
            jawaban: s.jenis === "isian" && !Array.isArray(s.jawaban) && s.jawaban
              ? [s.jawaban]
              : s.jawaban || (s.jenis === "isian" ? [""] : ""),
            opsi: s.opsi || [],
            jenis: s.jenis || "pilihan_ganda",
            gambar: s.gambar || null // Preserve gambar base64
          }));
          
          console.log("📝 Edit mode - Loaded soal:", normalizedSoal);
          console.log("🖼️ Gambar loaded:", normalizedSoal.filter(s => s.gambar).length, "soal memiliki gambar");
          setSoalList(normalizedSoal);
          setJumlahSoal(normalizedSoal.length);
        }

        // Clear sessionStorage setelah load
        sessionStorage.removeItem("editMateri");
      } catch (error) {
        console.error("Error loading edit data:", error);
      }
    }
  }, []);

  // Handle kategori change
  const handleKategoriChange = (value) => {
    setKategori(value);
    if (value === "Lainnya") {
      setShowKategoriInput(true);
    } else {
      setShowKategoriInput(false);
      setKategoriCustom("");
    }
  };

  // Get final kategori value
  const getFinalKategori = () => {
    return kategori === "Lainnya" ? kategoriCustom : kategori;
  };

  // generate template soal
  const handleGenerateSoal = () => {
    let newErrors = {};
    const finalKategori = getFinalKategori();
    if (!kategori) newErrors.kategori = "Kategori wajib dipilih";
    if (kategori === "Lainnya" && !kategoriCustom.trim()) newErrors.kategoriCustom = "Nama kategori wajib diisi";
    if (!materi.trim()) newErrors.materi = "Materi wajib diisi";
    if (jumlahSoal < 1) newErrors.jumlahSoal = "Jumlah soal minimal 1";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newSoal = Array.from({ length: jumlahSoal }, (_, i) => ({
      id: i + 1,
      soal: "",
      gambar: null, // null = no image yet
      jenis: "pilihan_ganda",
      opsi: ["", ""],
      jawaban: "",
      jawabanHuruf: "",
    }));
    
    console.log("📝 Generated", jumlahSoal, "soal template");

    setSoalList(newSoal);
    setErrors({});
  };

  // handler soal
  const handleSoalChange = (index, value) => {
    const updated = [...soalList];
    updated[index].soal = value;
    setSoalList(updated);
  };

  const handleUploadGambar = (index, file) => {
    if (file === null) {
      // Hapus gambar
      const updated = [...soalList];
      updated[index].gambar = null;
      setSoalList(updated);
      console.log('🗑️ Gambar dihapus untuk soal', index + 1);
      return;
    }
    
    // Validasi file
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }
    
    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB');
      return;
    }
    
    console.log('📤 Memproses gambar untuk soal', index + 1, '...');
    
    // Konversi gambar ke base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSoalList(prevList => {
        const updated = [...prevList];
        updated[index].gambar = reader.result; // base64 string
        console.log('✅ Gambar berhasil diupload untuk soal', index + 1);
        console.log('📊 Base64 length:', reader.result.length);
        return updated;
      });
    };
    reader.onerror = () => {
      console.error('❌ Gagal membaca file gambar');
      alert('Gagal membaca file gambar');
    };
    reader.readAsDataURL(file);
  };

  const handleOpsiChange = (soalIndex, opsiIndex, value) => {
    const updated = [...soalList];
    updated[soalIndex].opsi[opsiIndex] = value;
    setSoalList(updated);
  };

  const tambahOpsi = (soalIndex) => {
    const updated = [...soalList];
    updated[soalIndex].opsi.push("");
    setSoalList(updated);
  };

  const handleJenisChange = (index, value) => {
    const updated = [...soalList];
    updated[index].jenis = value;
    if (value === "pilihan_ganda") {
      updated[index].opsi = ["", ""];
      updated[index].jawaban = "";
      updated[index].jawabanHuruf = "";
    } else if (value === "isian") {
      // Isian singkat bisa multiple jawaban
      updated[index].opsi = [];
      updated[index].jawaban = [""];
      updated[index].jawabanHuruf = "";
    } else {
      // Essay
      updated[index].opsi = [];
      updated[index].jawaban = "";
      updated[index].jawabanHuruf = "";
    }
    setSoalList(updated);
  };

  const handleJawabanChange = (index, value) => {
    const updated = [...soalList];
    const currentSoal = updated[index];
    
    // Untuk pilihan ganda dan essay: jawaban string
    // Untuk isian: jawaban array
    if (currentSoal.jenis === "isian") {
      // Pastikan jawaban selalu array untuk isian
      updated[index].jawaban = Array.isArray(value.text) ? value.text : [value.text || ""];
    } else {
      // Pilihan ganda dan essay: jawaban string
      updated[index].jawaban = Array.isArray(value.text) ? value.text[0] || "" : value.text;
    }
    updated[index].jawabanHuruf = value.huruf || "";
    setSoalList(updated);
  };

  // validasi
  const validateForm = () => {
    console.log("🔍 Starting validation...");
    let newErrors = {};

    const finalKategori = getFinalKategori();
    if (!kategori) newErrors.kategori = "Kategori wajib dipilih";
    if (kategori === "Lainnya" && !kategoriCustom.trim()) newErrors.kategoriCustom = "Nama kategori wajib diisi";
    if (!materi.trim()) newErrors.materi = "Materi wajib diisi";

    console.log("📋 Form errors:", newErrors);

    const soalErrors = soalList.map((soal, idx) => {
      console.log(`🔍 Validating soal ${idx + 1}:`, soal);
      let err = {};
      if (!soal.soal.trim()) err.soal = "Pertanyaan wajib diisi";

      if (soal.jenis === "pilihan_ganda") {
        const opsiErrors = soal.opsi.map((o) =>
          !o.trim() ? "Opsi wajib diisi" : ""
        );
        // Hanya tambahkan error jika ada opsi yang kosong
        if (opsiErrors.some(e => e !== "")) {
          err.opsi = opsiErrors;
        }
        // Validasi jawaban: harus ada jawabanHuruf ATAU jawaban terisi
        if (!soal.jawabanHuruf && (!soal.jawaban || !soal.jawaban.trim())) {
          err.jawaban = "Jawaban benar wajib dipilih";
        }
      }

      if (soal.jenis === "isian") {
        // Validasi untuk isian singkat (harus array)
        if (!Array.isArray(soal.jawaban)) {
          // Konversi ke array jika bukan array
          err.jawaban = "Format jawaban tidak valid";
        } else {
          // Filter jawaban yang tidak kosong
          const validAnswers = soal.jawaban.filter(j => j && typeof j === 'string' && j.trim() !== "");
          if (validAnswers.length === 0) {
            err.jawaban = "Minimal 1 jawaban wajib diisi";
          }
        }
      }

      if (soal.jenis === "essay") {
        if (!soal.jawaban || !soal.jawaban.trim()) {
          err.jawaban = "Jawaban wajib diisi";
        }
      }

      return err;
    });

    newErrors.soalList = soalErrors;
    setErrors(newErrors);

    // Cek apakah ada error di form utama (kategori, materi, dll)
    const hasFormErrors = Object.keys(newErrors).filter(key => key !== 'soalList').length > 0;
    
    // Cek apakah ada error di soal list
    const hasSoalErrors = soalErrors.some((err) => Object.keys(err).length > 0);
    
    console.log("📊 Validation result:", {
      hasFormErrors,
      hasSoalErrors,
      formErrors: newErrors,
      soalErrors,
      isValid: !hasFormErrors && !hasSoalErrors
    });
    
    // Return true jika TIDAK ada error sama sekali
    return !hasFormErrors && !hasSoalErrors;
  };

  // copy PIN
  const handleCopyPin = () => {
    navigator.clipboard.writeText(pinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // simpan
  const handleSimpan = async () => {
    console.log("💾 Validating form...");
    console.log("💾 Soal list:", soalList);
    
    if (!validateForm()) {
      console.log("❌ Validation failed:", errors);
      return;
    }

    console.log("✅ Validation passed");
    setLoading(true);

    try {
      // Get user token from authService
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (!token || !user.id) {
        alert("Anda harus login terlebih dahulu untuk membuat soal");
        setLoading(false);
        navigate('/login');
        return;
      }

      // Clean jawaban array - remove empty strings for isian type only
      const cleanedSoalList = soalList.map(s => ({
        ...s,
        jawaban: s.jenis === "isian" && Array.isArray(s.jawaban) 
          ? s.jawaban.filter(j => j && typeof j === 'string' && j.trim() !== "")
          : s.jawaban
      }));

      console.log("💾 Cleaned soal list:", cleanedSoalList);

      // Get final kategori value
      const finalKategori = getFinalKategori();
      console.log("📁 Final kategori:", finalKategori);

      // STEP 1: Create or get kategori via API
      let kategoriId = null;
      const kategoriResponse = await apiService.createKategori({
        nama_kategori: finalKategori,
        created_by: user.id
      }, token);

      if (kategoriResponse.status === "success") {
        kategoriId = kategoriResponse.data.id;
        console.log("✅ Kategori ID:", kategoriId, kategoriResponse.data.alreadyExists ? "(existing)" : "(new)");
        
        // Trigger event untuk update Kategori component
        window.dispatchEvent(new Event("customKategoriUpdated"));
      } else {
        throw new Error(kategoriResponse.message || "Gagal membuat kategori");
      }

      // STEP 2: Create materi via API
      const materiResponse = await apiService.createMateri({
        judul: materi,
        kategori_id: kategoriId,
        isi_materi: `Materi ${finalKategori} - ${materi}`
      }, token);

      if (materiResponse.status !== "success") {
        throw new Error(materiResponse.message || "Gagal membuat materi");
      }

      const materiId = materiResponse.data.id;
      console.log("✅ Materi ID:", materiId);

      // STEP 3: Transform soal to backend format
      const soalListBackend = cleanedSoalList.map(s => ({
        pertanyaan: s.soal,
        pilihan_a: s.jenis === "pilihan_ganda" ? s.opsi[0] : null,
        pilihan_b: s.jenis === "pilihan_ganda" ? s.opsi[1] : null,
        pilihan_c: s.jenis === "pilihan_ganda" ? s.opsi[2] : null,
        pilihan_d: s.jenis === "pilihan_ganda" ? s.opsi[3] : null,
        jawaban_benar: s.jenis === "pilihan_ganda" 
          ? s.jawaban 
          : (Array.isArray(s.jawaban) ? s.jawaban[0] : s.jawaban)
      }));

      // STEP 4: Create kumpulan_soal with soal_list via API
      const kumpulanSoalResponse = await apiService.createKumpulanSoal({
        kategori_id: kategoriId,
        materi_id: materiId,
        soal_list: soalListBackend
      }, token);

      if (kumpulanSoalResponse.status !== "success") {
        throw new Error(kumpulanSoalResponse.message || "Gagal membuat kumpulan soal");
      }

      const kumpulanSoalId = kumpulanSoalResponse.data.kumpulan_soal_id;
      console.log("✅ Kumpulan Soal ID:", kumpulanSoalId);
      console.log("✅ Jumlah soal:", cleanedSoalList.length);

      // STEP 5: Generate PIN via API (only for new soal)
      let newPin = "";
      if (!isEditMode) {
        const now = new Date();
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // Format datetime untuk MySQL: YYYY-MM-DD HH:MM:SS
        const formatMySQLDateTime = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };
        
        const quizData = {
          judul: `Quiz ${finalKategori} - ${materi}`,
          deskripsi: `Kumpulan soal ${finalKategori} tentang ${materi}`,
          kumpulan_soal_id: kumpulanSoalId,
          user_id: user.id,
          durasi: 30,
          tanggal_mulai: formatMySQLDateTime(now),
          tanggal_selesai: formatMySQLDateTime(endDate)
        };

        const pinResponse = await apiService.generatePin(quizData);
        
        if (pinResponse.status === "success") {
          newPin = pinResponse.data.pin_code;
          console.log("✅ PIN berhasil dibuat:", newPin);
          setPinCode(newPin);
        } else {
          throw new Error(pinResponse.message || "Gagal generate PIN");
        }
      } else {
        setPinCode("UPDATED");
      }

      console.log("✅ Semua data berhasil disimpan ke backend!");
      console.log("✅ Data akan tersedia di PHPMyAdmin");
      
      setLoading(false);
      
      // Scroll ke bawah untuk lihat modal PIN
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error("❌ Error saat menyimpan:", error);
      alert(error.message || "Terjadi kesalahan saat menyimpan soal. Pastikan backend sudah running.");
      setLoading(false);
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

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-20 border-b-2 border-orange-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-50 rounded-xl transition-all font-semibold text-gray-700 border-2 border-orange-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
            {isEditMode ? "✏️ Edit Soal" : "✨ Buat Soal Versi Kamu"}
          </h1>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-5xl mx-auto flex-1 w-full relative z-10">

      {/* Card Form */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border-2 border-orange-200">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full flex items-center justify-center border-2 border-orange-300">📋</span>
          Informasi Dasar
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Pilih kategori */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Pilih Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={kategori}
              onChange={(e) => handleKategoriChange(e.target.value)}
              disabled={isEditMode}
              className={`border-2 p-3 rounded-lg w-full transition-all ${
                isEditMode ? "bg-gray-100 cursor-not-allowed" : "hover:border-blue-400"
              } ${
                errors.kategori
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
            >
              <option value="">-- Pilih Kategori --</option>
              {kategoriFromAPI.map((k, idx) => (
                <option key={idx} value={k.nama_kategori}>
                  {k.nama_kategori}
                </option>
              ))}
              <option value="Lainnya">➕ Buat Kategori Baru</option>
            </select>
            {errors.kategori && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.kategori}
              </p>
            )}
            
            {/* Input kategori custom */}
            {showKategoriInput && (
              <div className="mt-3 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>✏️</span>
                  <span>Nama Kategori Baru</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={kategoriCustom}
                  onChange={(e) => setKategoriCustom(e.target.value)}
                  className={`border-2 p-3 rounded-lg w-full transition-all hover:border-blue-400 ${
                    errors.kategoriCustom
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                  placeholder="Contoh: Sains, Teknologi, Komputer, dll"
                />
                {errors.kategoriCustom && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.kategoriCustom}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Kategori baru akan otomatis tersedia untuk quiz berikutnya
                </p>
              </div>
            )}
          </div>

          {/* Materi */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Materi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              disabled={isEditMode}
              className={`border-2 p-3 rounded-lg w-full transition-all ${
                isEditMode ? "bg-gray-100 cursor-not-allowed" : "hover:border-blue-400"
              } ${
                errors.materi
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
              placeholder="Contoh: Bangun Datar"
            />
            {errors.materi && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.materi}
              </p>
            )}
          </div>
        </div>

        {/* Jumlah soal */}
        {!isEditMode && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <label className="block font-semibold text-gray-800 mb-3 text-lg">
              🎯 Jumlah Soal yang Akan Dibuat
            </label>
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={jumlahSoal}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string for user to type
                    if (value === "") {
                      setJumlahSoal("");
                      return;
                    }
                    // Only allow numbers
                    if (!/^\d+$/.test(value)) {
                      return;
                    }
                    // Parse and validate
                    const num = parseInt(value);
                    if (num >= 1 && num <= 50) {
                      setJumlahSoal(num);
                    } else if (num > 50) {
                      setJumlahSoal(50);
                    }
                  }}
                  onBlur={(e) => {
                    // Set to 1 if empty on blur
                    if (e.target.value === "" || e.target.value === "0") {
                      setJumlahSoal(1);
                    }
                  }}
                  className={`border-2 p-3 rounded-xl w-full md:w-50 text-center font-bold transition-all shadow-md ${
                    errors.jumlahSoal
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  }`}
                  placeholder="Masukkan angka"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  
                </div>
              </div>
              <button
                onClick={handleGenerateSoal}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="text-2xl">⚡</span>
                Generate Template Soal
              </button>
            </div>
            {errors.jumlahSoal && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.jumlahSoal}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Ketik jumlah soal yang ingin dibuat (1-50 soal)
            </p>
          </div>
        )}
      </div>

      {/* Form soal */}
      {soalList.map((soal, i) => (
        <FormBuatSoal
          key={i}
          index={i}
          soal={soal}
          errors={errors.soalList?.[i] || {}}
          handleSoalChange={handleSoalChange}
          handleUploadGambar={handleUploadGambar}
          handleOpsiChange={handleOpsiChange}
          tambahOpsi={tambahOpsi}
          handleJenisChange={handleJenisChange}
          handleJawabanChange={handleJawabanChange}
        />
      ))}

      {/* Tombol simpan */}
      {soalList.length > 0 && !pinCode && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t-4 border-green-500 shadow-2xl p-4 rounded-t-2xl z-30">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-3 items-center relative z-10">
            <div className="flex-1 text-sm text-gray-600">
              <p className="font-semibold">📝 {soalList.length} soal siap disimpan</p>
              <p className="text-xs">Pastikan semua soal sudah terisi dengan benar</p>
            </div>
            <button
              onClick={handleSimpan}
              disabled={loading}
              className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all transform hover:scale-105 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-2xl"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-6 w-6" />
                  Menyimpan...
                </>
              ) : isEditMode ? (
                <>
                  <span className="text-2xl">💾</span>
                  Simpan Perubahan
                </>
              ) : (
                <>
                  <span className="text-2xl">🚀</span>
                  Buat Soal
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PIN Display atau Success Message */}
      {pinCode && !isEditMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform animate-bounce-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">🎉</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Soal Berhasil Dibuat!
              </h2>
              <p className="text-gray-600 mb-6">
                Quiz Anda telah berhasil dibuat dan siap digunakan
              </p>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-300">
                <p className="text-sm text-gray-700 font-semibold mb-3">🔑 PIN Quiz Anda:</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="bg-white px-6 py-4 rounded-xl border-2 border-green-500 shadow-lg">
                    <span className="text-4xl font-mono font-bold text-green-600 tracking-widest">
                      {pinCode}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyPin}
                    className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all transform hover:scale-110 shadow-lg"
                    title="Copy PIN"
                  >
                    {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600 font-semibold animate-pulse">
                    ✓ PIN berhasil disalin!
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  📱 Bagikan PIN ini kepada peserta untuk mengikuti quiz
                </p>
              </div>
              
              <button
                onClick={() => navigate("/halaman-awal-kreator")}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Kembali ke Halaman Utama
              </button>
            </div>
          </div>
        </div>
      )}
      
      {pinCode && isEditMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform animate-bounce-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Soal Berhasil Diperbarui!
              </h2>
              <p className="text-gray-600 mb-6">
                Perubahan soal telah disimpan dengan sukses
              </p>
              <button
                onClick={() => navigate("/halaman-awal-kreator")}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Kembali ke Halaman Utama
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
      <Footer />
    </div>
  );
}
