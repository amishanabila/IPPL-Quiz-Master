// src/pages/BuatSoal.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FormBuatSoal from "../buatsoal/FormBuatSoal";
import Footer from "../footer/Footer";
import { Loader2 } from "lucide-react"; // Loader icon
import { apiService } from "../services/api";
import BuatSoalBerhasil from "../popup/BuatSoalBerhasil";
import EditSoalBerhasil from "../popup/EditSoalBerhasil";
import HapusSoalTerakhirPopup from "../popup/HapusSoalTerakhirPopup";

export default function BuatSoal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [kategori, setKategori] = useState("");
  const [kategoriCustom, setKategoriCustom] = useState("");
  const [showKategoriInput, setShowKategoriInput] = useState(false);
  const [materi, setMateri] = useState("");
  const [jumlahSoal, setJumlahSoal] = useState(1);
  const [tipeWaktu, setTipeWaktu] = useState('per_soal'); // 🔥 'per_soal' atau 'keseluruhan'
  const [waktuPerSoal, setWaktuPerSoal] = useState(60); // 🔥 Timer per soal (default 60 detik)
  const [waktuKeseluruhan, setWaktuKeseluruhan] = useState(null); // 🔥 Timer keseluruhan quiz dalam detik
  const [soalList, setSoalList] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // 🔥 loading state
  const [pinCode, setPinCode] = useState(""); // 🔥 PIN code state
  const [isEditMode, setIsEditMode] = useState(false); // 🔥 edit mode state
  const [kumpulanSoalId, setKumpulanSoalId] = useState(null);
  const [kategoriFromAPI, setKategoriFromAPI] = useState([]); // kategori from API
  const [showEditSuccess, setShowEditSuccess] = useState(false); // 🔥 popup edit sukses
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🔥 popup konfirmasi hapus soal terakhir
  const [draftKey, setDraftKey] = useState(""); // localStorage key untuk draft

  // 🔥 VALIDATION: Check if user is kreator
  React.useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const token = localStorage.getItem('authToken');
    
    console.log('🔍 BuatSoal - Checking user role:', userData.role);
    
    if (!token || !userData.id) {
      alert('❌ Anda harus login terlebih dahulu untuk membuat soal');
      navigate('/login', { replace: true });
      return;
    }
    
    if (userData.role !== 'kreator') {
      alert('❌ Error: Halaman ini hanya untuk KREATOR!\n\nAnda login sebagai: ' + (userData.role || 'unknown') + '\n\nSilakan login dengan akun kreator untuk membuat soal.');
      console.error('❌ Access denied: User role is', userData.role, 'but kreator required');
      navigate('/', { replace: true });
      return;
    }
    
    console.log('✅ User is kreator, access granted');
  }, [navigate]);

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

  // Load draft dari localStorage (untuk create mode)
  React.useEffect(() => {
    if (isEditMode || pinCode) return; // Skip jika edit mode atau sudah berhasil dibuat

    const key = "quizDraft_" + (localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).id : 'guest');
    setDraftKey(key);

    const draft = localStorage.getItem(key);
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        console.log("📂 Loading draft from localStorage");
        
        // Restore form data
        if (draftData.kategori) setKategori(draftData.kategori);
        if (draftData.kategoriCustom) {
          setKategoriCustom(draftData.kategoriCustom);
          setShowKategoriInput(true);
        }
        if (draftData.materi) setMateri(draftData.materi);
        if (draftData.jumlahSoal) setJumlahSoal(draftData.jumlahSoal);
        if (draftData.tipeWaktu) setTipeWaktu(draftData.tipeWaktu);
        if (draftData.waktuPerSoal) setWaktuPerSoal(draftData.waktuPerSoal);
        if (draftData.waktuKeseluruhan) setWaktuKeseluruhan(draftData.waktuKeseluruhan);
        if (draftData.soalList && draftData.soalList.length > 0) {
          setSoalList(draftData.soalList);
          console.log("✅ Restored", draftData.soalList.length, "soal from draft");
        }
      } catch (error) {
        console.error("❌ Error loading draft:", error);
      }
    }
  }, [isEditMode, pinCode]);

  // Save draft ke localStorage setiap ada perubahan (untuk create mode)
  React.useEffect(() => {
    if (isEditMode || pinCode || !draftKey) return; // Skip jika edit mode atau sudah berhasil dibuat

    const saveDraft = () => {
      const draftData = {
        kategori,
        kategoriCustom,
        materi,
        jumlahSoal,
        tipeWaktu,
        waktuPerSoal,
        waktuKeseluruhan,
        soalList,
        savedAt: new Date().toISOString()
      };
      
      try {
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        console.log("💾 Draft saved to localStorage");
      } catch (error) {
        console.error("❌ Error saving draft:", error);
        // Jika error (mungkin karena localStorage penuh), hapus draft lama
        if (error.name === 'QuotaExceededError') {
          console.log("⚠️ localStorage full, clearing draft");
          localStorage.removeItem(draftKey);
        }
      }
    };

    // Debounce save (tunggu 1 detik setelah perubahan terakhir)
    const timeoutId = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeoutId);
  }, [kategori, kategoriCustom, materi, jumlahSoal, tipeWaktu, waktuPerSoal, waktuKeseluruhan, soalList, isEditMode, pinCode, draftKey]);

  // Load data untuk edit mode dari location.state
  React.useEffect(() => {
    const loadEditData = async () => {
      const stateData = location.state;
      
      if (stateData && stateData.kumpulan_soal_id) {
        // Edit mode
        setIsEditMode(true);
        setKumpulanSoalId(stateData.kumpulan_soal_id);
        
        console.log("📝 Loading edit mode data:", {
          kumpulan_soal_id: stateData.kumpulan_soal_id,
          materi_id: stateData.materi_id,
          materi_id_type: typeof stateData.materi_id,
          kategori_id: stateData.kategori_id,
          materi: stateData.materi,
          kategori: stateData.kategori
        });

        try {
          // Fetch soal from API
          const response = await apiService.getSoalByKumpulanSoal(stateData.kumpulan_soal_id);
          
          if (response.status === "success" && response.data) {
            const soalFromAPI = response.data.soal_list || [];
            const waktuPerSoalFromAPI = response.data.waktu_per_soal || 60;
            const waktuKeseluruhanFromAPI = response.data.waktu_keseluruhan;
            const tipeWaktuFromAPI = response.data.tipe_waktu || 'per_soal';
            
            console.log("📸 Soal dari API:", soalFromAPI);
            console.log("📸 Soal pertama gambar:", soalFromAPI[0]?.gambar ? "Ada gambar" : "Tidak ada gambar");
            
            // Set kategori dan materi SETELAH dapat data dari API
            setKategori(response.data.nama_kategori || stateData.kategori || "");
            setMateri(response.data.materi_judul || stateData.materi || "");
            setWaktuPerSoal(waktuPerSoalFromAPI);
            setWaktuKeseluruhan(waktuKeseluruhanFromAPI);
            setTipeWaktu(tipeWaktuFromAPI);

            // Transform backend format to frontend format
            const transformedSoal = soalFromAPI.map((s, idx) => {
              // Determine jenis soal
              const isPilihanGanda = s.pilihan_a && s.pilihan_b;
              const isIsian = !isPilihanGanda && !s.pilihan_c && !s.pilihan_d;
              
              // Parse jawaban - handle array untuk isian singkat dan variasi_jawaban
              let jawaban;
              if (isIsian) {
                // Untuk isian singkat, cek variasi_jawaban terlebih dahulu
                if (s.variasi_jawaban) {
                  try {
                    jawaban = typeof s.variasi_jawaban === 'string' 
                      ? JSON.parse(s.variasi_jawaban) 
                      : s.variasi_jawaban;
                  } catch (e) {
                    console.log('⚠️ Failed to parse variasi_jawaban:', e);
                    // Fallback ke jawaban_benar
                    jawaban = Array.isArray(s.jawaban_benar) ? s.jawaban_benar : [s.jawaban_benar];
                  }
                } else if (Array.isArray(s.jawaban_benar)) {
                  jawaban = s.jawaban_benar;
                } else {
                  jawaban = [s.jawaban_benar];
                }
              } else {
                // Pilihan ganda
                jawaban = Array.isArray(s.jawaban_benar) ? s.jawaban_benar[0] : s.jawaban_benar;
              }
              
              const transformed = {
                id: s.soal_id || idx + 1,
                soal: s.pertanyaan,
                pertanyaan: s.pertanyaan,
                gambar: s.gambar || null, // Load gambar dari backend
                jenis: isPilihanGanda ? "pilihan_ganda" : "isian",
                opsi: isPilihanGanda ? [s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d].filter(Boolean) : [],
                jawaban: jawaban,
                jawabanHuruf: isPilihanGanda && [s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d].indexOf(Array.isArray(jawaban) ? jawaban[0] : jawaban) >= 0
                  ? String.fromCharCode(65 + [s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d].indexOf(Array.isArray(jawaban) ? jawaban[0] : jawaban))
                  : ""
              };
              
              if (idx === 0) {
                console.log("📸 Transformed soal pertama:", {
                  id: transformed.id,
                  gambar: transformed.gambar ? "Ada gambar (length: " + transformed.gambar.length + ")" : "Tidak ada gambar",
                  jenis: transformed.jenis
                });
              }
              
              return transformed;
            });

            setSoalList(transformedSoal);
            setJumlahSoal(transformedSoal.length);
            console.log("✅ Loaded soal for edit:", transformedSoal.length, "soal");
            console.log("📸 Total soal dengan gambar:", transformedSoal.filter(s => s.gambar).length);
          }
        } catch (error) {
          console.error("❌ Error loading soal data:", error);
          alert("Gagal memuat data soal");
          navigate("/halaman-awal-kreator");
        }
      }
    };

    loadEditData();
  }, [location.state, navigate]);

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

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Scale down jika terlalu besar
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert ke base64 dengan kompresi
          const compressedBase64 = canvas.toDataURL(file.type, quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadGambar = async (index, file) => {
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
    console.log('📊 Ukuran asli:', (file.size / 1024).toFixed(2), 'KB');
    
    try {
      // Kompress gambar untuk mengurangi ukuran
      const compressedBase64 = await compressImage(file, 800, 0.8);
      
      setSoalList(prevList => {
        const updated = [...prevList];
        updated[index].gambar = compressedBase64;
        console.log('✅ Gambar berhasil diupload untuk soal', index + 1);
        console.log('📊 Ukuran compressed:', (compressedBase64.length / 1024).toFixed(2), 'KB');
        console.log('📉 Compression ratio:', ((1 - (compressedBase64.length / (file.size * 1.37))) * 100).toFixed(1) + '%');
        return updated;
      });
    } catch (error) {
      console.error('❌ Gagal memproses gambar:', error);
      alert('Gagal memproses gambar. Coba lagi.');
    }
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
    }
    setSoalList(updated);
  };

  const handleJawabanChange = (index, value) => {
    const updated = [...soalList];
    const currentSoal = updated[index];
    
    // Untuk pilihan ganda: jawaban string
    // Untuk isian: jawaban array
    if (currentSoal.jenis === "isian") {
      // Pastikan jawaban selalu array untuk isian
      updated[index].jawaban = Array.isArray(value.text) ? value.text : [value.text || ""];
    } else {
      // Pilihan ganda: jawaban string
      updated[index].jawaban = Array.isArray(value.text) ? value.text[0] || "" : value.text;
    }
    updated[index].jawabanHuruf = value.huruf || "";
    setSoalList(updated);
  };

  // validasi
  const validateForm = () => {
    console.log("🔍 Starting validation...");
    let newErrors = {};

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

      // STEP 1: Get kategori_id and materi_id
      let kategoriId = null;
      let materiId = null;

      // Get or create kategori (for both create and edit mode)
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
        throw new Error(kategoriResponse.message || "Gagal mendapatkan kategori");
      }

      // STEP 2: Handle materi (create or update)
      if (isEditMode && location.state && location.state.materi_id && 
          typeof location.state.materi_id === 'number' && location.state.materi_id > 0) {
        // Edit mode: Try to update existing materi
        try {
          console.log("📝 Attempting to update materi ID:", location.state.materi_id);
          const materiUpdateResponse = await apiService.updateMateri(location.state.materi_id, {
            judul: materi,
            kategori_id: kategoriId,
            isi_materi: `Materi ${finalKategori} - ${materi}`
          }, token);

          if (materiUpdateResponse.status === "success") {
            materiId = location.state.materi_id;
            console.log("✅ Materi Updated:", materiId);
          } else {
            // If update fails, create new materi
            console.warn("⚠️ Update failed, creating new materi instead");
            throw new Error("Update materi failed");
          }
        } catch (updateError) {
          console.error("❌ Error updating materi, creating new:", updateError);
          // Fallback: Create new materi
          const materiResponse = await apiService.createMateri({
            judul: materi,
            kategori_id: kategoriId,
            isi_materi: `Materi ${finalKategori} - ${materi}`
          }, token);

          if (materiResponse.status !== "success") {
            throw new Error(materiResponse.message || "Gagal membuat materi");
          }

          materiId = materiResponse.data.id;
          console.log("✅ New Materi Created (fallback):", materiId);
        }
      } else {
        // Create mode: Create new materi
        const materiResponse = await apiService.createMateri({
          judul: materi,
          kategori_id: kategoriId,
          isi_materi: `Materi ${finalKategori} - ${materi}`
        }, token);

        if (materiResponse.status !== "success") {
          throw new Error(materiResponse.message || "Gagal membuat materi");
        }

        materiId = materiResponse.data.id;
        console.log("✅ Materi ID:", materiId);
      }

      // STEP 3: Transform soal to backend format
      const soalListBackend = cleanedSoalList.map(s => ({
        pertanyaan: s.soal,
        gambar: s.gambar || null, // Kirim gambar base64
        pilihan_a: s.jenis === "pilihan_ganda" ? s.opsi[0] : null,
        pilihan_b: s.jenis === "pilihan_ganda" ? s.opsi[1] : null,
        pilihan_c: s.jenis === "pilihan_ganda" ? s.opsi[2] : null,
        pilihan_d: s.jenis === "pilihan_ganda" ? s.opsi[3] : null,
        // Kirim array lengkap untuk isian singkat, string untuk pilihan ganda
        jawaban_benar: s.jenis === "isian" 
          ? s.jawaban // Array untuk isian singkat
          : s.jawaban // String untuk pilihan ganda
      }));

      // STEP 4: Create or Update kumpulan_soal with soal_list via API
      let kumpulanSoalResponse;
      let kumpulanSoalIdResult;

      if (isEditMode && kumpulanSoalId) {
        // Edit mode: Update existing kumpulan_soal
        kumpulanSoalResponse = await apiService.updateKumpulanSoal(kumpulanSoalId, {
          kategori_id: kategoriId,
          materi_id: materiId,
          soal_list: soalListBackend,
          waktu_per_soal: waktuPerSoal,
          waktu_keseluruhan: waktuKeseluruhan,
          tipe_waktu: tipeWaktu
        }, token);

        if (kumpulanSoalResponse.status !== "success") {
          throw new Error(kumpulanSoalResponse.message || "Gagal memperbarui kumpulan soal");
        }

        kumpulanSoalIdResult = kumpulanSoalId;
        console.log("✅ Kumpulan Soal Updated:", kumpulanSoalIdResult);
      } else {
        // Create mode: Create new kumpulan_soal
        kumpulanSoalResponse = await apiService.createKumpulanSoal({
          kategori_id: kategoriId,
          materi_id: materiId,
          soal_list: soalListBackend,
          waktu_per_soal: waktuPerSoal,
          waktu_keseluruhan: waktuKeseluruhan,
          tipe_waktu: tipeWaktu
        }, token);

        if (kumpulanSoalResponse.status !== "success") {
          throw new Error(kumpulanSoalResponse.message || "Gagal membuat kumpulan soal");
        }

        kumpulanSoalIdResult = kumpulanSoalResponse.data.kumpulan_soal_id;
        console.log("✅ Kumpulan Soal ID:", kumpulanSoalIdResult);
      }

      console.log("✅ Jumlah soal:", cleanedSoalList.length);

      // STEP 5: Get PIN from kumpulan_soal (auto-generated by trigger)
      if (!isEditMode) {
        // PIN sudah auto-generated oleh database trigger saat create kumpulan_soal
        // Ambil PIN dari response atau query ulang
        let newPin = kumpulanSoalResponse.data.pin_code;
        
        // Jika PIN belum ada di response, query ulang
        if (!newPin) {
          console.log("🔄 Fetching PIN from database...");
          const soalData = await apiService.getSoalByKumpulanSoal(kumpulanSoalIdResult);
          newPin = soalData.data.pin_code;
        }
        
        if (newPin) {
          console.log("✅ PIN berhasil dibuat (auto-generated):", newPin);
          setPinCode(newPin);
          
          // Hapus draft dari localStorage setelah berhasil
          if (draftKey) {
            localStorage.removeItem(draftKey);
            console.log("🗑️ Draft cleared from localStorage");
          }
          
          setLoading(false);
          
          // Scroll ke bawah untuk lihat modal PIN
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 100);
        } else {
          throw new Error("PIN tidak ditemukan. Database trigger mungkin tidak aktif.");
        }
      } else {
        // Edit mode: tampilkan popup sukses
        console.log("✅ Soal berhasil diperbarui!");
        setLoading(false);
        
        // Tampilkan popup edit sukses
        setShowEditSuccess(true);
      }

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

      <div className="flex-1 flex flex-col relative z-10">
        {/* Header - Same style as Leaderboard */}
        <div className="py-6 flex items-center justify-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white hover:shadow-lg transition-all font-semibold text-gray-700 border-2 border-orange-200"
          >
            ← Kembali
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
            {isEditMode ? "✏️ Edit Soal" : "✨ Buat Soal Versi Kamu"}
          </h1>
        </div>

        <div className="p-4 md:p-6 max-w-5xl mx-auto flex-1 w-full">

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
              className={`border-2 p-3 rounded-lg w-full transition-all hover:border-blue-400 ${
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
              className={`border-2 p-3 rounded-lg w-full transition-all hover:border-blue-400 ${
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

        {/* Pengaturan Waktu */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border-2 border-orange-200">
          <label className="block font-semibold text-gray-800 mb-4 text-lg">
            ⏱️ Pengaturan Waktu Quiz
          </label>
          
          {/* Pilih Tipe Waktu */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipeWaktu('per_soal')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  tipeWaktu === 'per_soal'
                    ? "bg-orange-500 border-orange-600 text-white shadow-lg"
                    : "bg-white border-orange-300 text-gray-700 hover:bg-orange-50"
                }`}
              >
                <div className="font-bold text-lg mb-1">📝 Waktu Per Soal</div>
                <div className={`text-sm ${tipeWaktu === 'per_soal' ? 'text-white' : 'text-gray-600'}`}>
                  Setiap soal memiliki waktu sendiri
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setTipeWaktu('keseluruhan')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  tipeWaktu === 'keseluruhan'
                    ? "bg-orange-500 border-orange-600 text-white shadow-lg"
                    : "bg-white border-orange-300 text-gray-700 hover:bg-orange-50"
                }`}
              >
                <div className="font-bold text-lg mb-1">⏰ Waktu Keseluruhan</div>
                <div className={`text-sm ${tipeWaktu === 'keseluruhan' ? 'text-white' : 'text-gray-600'}`}>
                  Total waktu untuk semua soal
                </div>
              </button>
            </div>
          </div>

          {/* Input Waktu Per Soal */}
          {tipeWaktu === 'per_soal' && (
            <div>
              <label className="block font-semibold text-gray-700 mb-3">
                Waktu Per Soal (detik)
              </label>
              <div className="flex flex-col md:flex-row gap-3 items-stretch">
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={waktuPerSoal}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 60;
                    if (value >= 10 && value <= 300) {
                      setWaktuPerSoal(value);
                    }
                  }}
                  className="border-2 border-orange-300 p-3 rounded-lg w-full md:w-48 text-lg font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <div className="flex gap-2 flex-wrap">
                  {[30, 60, 90, 120].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setWaktuPerSoal(time)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        waktuPerSoal === time
                          ? "bg-orange-500 text-white shadow-lg"
                          : "bg-white border-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                      }`}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Timer akan reset setiap pindah soal
              </p>
            </div>
          )}

          {/* Input Waktu Keseluruhan */}
          {tipeWaktu === 'keseluruhan' && (
            <div>
              <label className="block font-semibold text-gray-700 mb-3">
                Total Waktu Quiz (menit)
              </label>
              <div className="flex flex-col md:flex-row gap-3 items-stretch">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={waktuKeseluruhan ? Math.floor(waktuKeseluruhan / 60) : jumlahSoal}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    if (value >= 1 && value <= 180) {
                      setWaktuKeseluruhan(value * 60);
                    }
                  }}
                  className="border-2 border-orange-300 p-3 rounded-lg w-full md:w-48 text-lg font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 15, 30].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setWaktuKeseluruhan(mins * 60)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        waktuKeseluruhan === mins * 60
                          ? "bg-orange-500 text-white shadow-lg"
                          : "bg-white border-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                      }`}
                    >
                      {mins} menit
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Waktu berjalan terus meskipun refresh browser (anti-curang)
              </p>
            </div>
          )}
        </div>

        {/* Jumlah soal */}
        {!isEditMode && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <label className="block font-semibold text-gray-800 mb-3 text-lg">
              🎯 Jumlah Soal yang Akan Dibuat
            </label>
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="relative flex-1">
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
                  className={`border-2 p-3 rounded-xl w-full text-center text-xl font-bold transition-all shadow-md ${
                    errors.jumlahSoal
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  }`}
                  placeholder="Masukkan angka"
                />
              </div>
              <button
                onClick={handleGenerateSoal}
                className="px-8 py-3 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
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

      {/* Tombol Tambah/Kurangi Soal (untuk edit mode) */}
      {isEditMode && soalList.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border-2 border-blue-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 mb-2">✏️ Edit Jumlah Soal</h3>
              <p className="text-sm text-gray-600">
                Saat ini ada <span className="font-bold text-blue-600">{soalList.length} soal</span>. 
                Anda bisa menambah atau menghapus soal sesuai kebutuhan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const newSoal = {
                    id: soalList.length + 1,
                    soal: "",
                    gambar: null,
                    jenis: "pilihan_ganda",
                    opsi: ["", ""],
                    jawaban: "",
                    jawabanHuruf: "",
                  };
                  setSoalList([...soalList, newSoal]);
                  console.log("➕ Menambah soal baru");
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span className="text-xl">➕</span>
                Tambah Soal
              </button>
              {soalList.length > 1 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <span className="text-xl">➖</span>
                  Hapus Soal Terakhir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Success Popup - Create Mode */}
      {pinCode && !isEditMode && (
        <BuatSoalBerhasil 
          pinCode={pinCode} 
          onClose={() => setPinCode("")}
          isEdit={false}
        />
      )}

      {/* Success Popup - Edit Mode */}
      {showEditSuccess && (
        <EditSoalBerhasil 
          onClose={() => {
            setShowEditSuccess(false);
            navigate("/halaman-awal-kreator");
          }}
        />
      )}

      {/* Konfirmasi Hapus Soal Terakhir */}
      {showDeleteConfirm && (
        <HapusSoalTerakhirPopup 
          nomorSoal={soalList.length}
          onConfirm={() => {
            setSoalList(soalList.slice(0, -1));
            setShowDeleteConfirm(false);
            console.log("➖ Menghapus soal terakhir");
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      </div>
      </div>

      <Footer />
    </div>
  );
}
