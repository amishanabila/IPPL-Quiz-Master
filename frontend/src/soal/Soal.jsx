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
  
  // Generate unique key untuk localStorage berdasarkan session
  const getStorageKey = () => {
    const stateData = location.state;
    const pin = stateData?.pin || 'unknown';
    const nama = stateData?.nama || 'anonymous';
    return `quiz_jawaban_${pin}_${nama}`;
  };

  // --- SESSION-BASED TIMER (Server timestamp) ---
  const [sessionId, setSessionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerMode, setTimerMode] = useState('keseluruhan'); // 'per_soal' or 'keseluruhan'
  const [waktuPerSoal, setWaktuPerSoal] = useState(60);
  const [totalWaktu, setTotalWaktu] = useState(0);
  const [waktuAwal, setWaktuAwal] = useState(0); // Waktu awal untuk perhitungan progress (tidak berubah)
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false); // Popup waktu habis

  // Load soal from API on mount
  useEffect(() => {
    const loadSoalFromAPI = async () => {
      try {
        console.log("🔍 Loading soal dari API");
        console.log("🔍 Location state:", location.state);
        console.log("🔍 URL slug:", slug);
        
        const stateData = location.state;
        
        // Check if this is a quiz flow (with kumpulan_soal_id from PIN validation)
        if (stateData?.quizData?.kumpulan_soal_id) {
          const kumpulanSoalId = stateData.quizData.kumpulan_soal_id;
          const namaPeserta = stateData.nama || 'Anonymous';
          const pinCode = stateData.pin;
          
          console.log("🎯 Quiz flow detected with kumpulan_soal_id:", kumpulanSoalId);
          console.log("👤 Nama peserta:", namaPeserta);
          
          setMateri({
            materi: stateData.quizData.judul || stateData.quizData.kategori,
            kategori: stateData.quizData.kategori || "Quiz"
          });
          
          // Start quiz session (akan otomatis resume jika sudah ada)
          try {
            const sessionResponse = await apiService.startQuiz({
              kumpulan_soal_id: kumpulanSoalId,
              nama_peserta: namaPeserta,
              pin_code: pinCode
            });
            
            console.log("📦 Start Quiz Session Response:", sessionResponse);
            
            if (sessionResponse.status === "success" && sessionResponse.data) {
              const sessionData = sessionResponse.data;
              
              // Hitung waktu awal terlebih dahulu sebelum set state
              const initialTotalWaktu = sessionData.tipe_waktu === 'per_soal' 
                ? sessionData.waktu_per_soal 
                : sessionData.total_waktu;
              
              console.log("⏱️ ========== TIMER INITIALIZATION ==========");
              console.log("⏱️ Timer mode:", sessionData.tipe_waktu);
              console.log("⏱️ Total waktu (initial):", initialTotalWaktu, "detik");
              console.log("⏱️ Sisa waktu (from server):", sessionData.sisa_waktu, "detik");
              console.log("⏱️ Waktu per soal:", sessionData.waktu_per_soal, "detik");
              console.log("⏱️ Is resume:", sessionData.is_resume);
              
              // Set semua state timer secara berurutan
              // PENTING: Set dalam urutan yang benar agar progress calculation tidak error
              setTimerMode(sessionData.tipe_waktu || 'keseluruhan');
              setWaktuPerSoal(sessionData.waktu_per_soal || 60);
              setTotalWaktu(sessionData.total_waktu || initialTotalWaktu); // Total waktu dari server (akurat)
              setWaktuAwal(sessionData.total_waktu || initialTotalWaktu);  // Waktu awal yang TIDAK BERUBAH untuk progress bar
              setTimeLeft(sessionData.sisa_waktu); // Sisa waktu dari server
              setSessionId(sessionData.session_id); // Session ID terakhir agar timer effect berjalan
              
              // Restore progress jika resume
              if (sessionData.is_resume) {
                console.log("🔄 Resuming quiz from index:", sessionData.current_soal_index);
                setCurrentIndex(sessionData.current_soal_index || 0);
              }
              
              console.log("✅ Timer initialized successfully");
              console.log("⏱️ Progress (sisa/total):", (sessionData.sisa_waktu / (sessionData.total_waktu || initialTotalWaktu) * 100).toFixed(1) + "%");
              console.log("⏱️ ==========================================");
              
              // Transform and load soal
              const soalFromAPI = sessionData.soal;
              if (soalFromAPI && soalFromAPI.length > 0) {
                const transformedSoal = soalFromAPI.map((s, idx) => {
                  // Determine jenis soal: if no pilihan, it's isian
                  const hasOptions = s.pilihan_a || s.pilihan_b || s.pilihan_c || s.pilihan_d;
                  const jenisSoal = hasOptions ? "pilihan_ganda" : "isian";
                  
                  // Parse variasi_jawaban untuk isian singkat
                  let jawaban = s.jawaban_benar;
                  if (jenisSoal === "isian" && s.variasi_jawaban) {
                    try {
                      // Parse JSON string menjadi array
                      jawaban = typeof s.variasi_jawaban === 'string' 
                        ? JSON.parse(s.variasi_jawaban) 
                        : s.variasi_jawaban;
                    } catch (e) {
                      console.log('⚠️ Failed to parse variasi_jawaban for soal', s.soal_id, ':', e);
                      // Fallback ke jawaban_benar jika parsing gagal
                      jawaban = [s.jawaban_benar];
                    }
                  }
                  
                  return {
                    id: s.soal_id || idx,
                    soal: s.pertanyaan,
                    pertanyaan: s.pertanyaan,
                    opsi: [s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d].filter(Boolean),
                    jawaban: jawaban, // Gunakan variasi_jawaban jika ada
                    jenis: jenisSoal,
                    gambar: s.gambar || null // Ambil gambar dari backend
                  };
                });
                
                console.log("✅ Quiz soal loaded:", transformedSoal.length);
                console.log("📝 Soal types:", transformedSoal.map(s => `${s.id}: ${s.jenis}`));
                console.log("📝 First soal jawaban type:", typeof transformedSoal[0]?.jawaban, Array.isArray(transformedSoal[0]?.jawaban) ? "array" : "single");
                setSoalListRandom(transformedSoal);
              }
            } else if (sessionResponse.timeExpired) {
              // Waktu sudah habis - JANGAN navigate(-1), langsung ke hasil jika ada data
              console.log("⏰ Session expired - checking for existing hasil data");
              alert("Waktu pengerjaan quiz sudah habis! Menampilkan hasil yang tersimpan...");
              
              // Cek localStorage untuk hasil yang mungkin sudah tersimpan
              const savedHasil = localStorage.getItem('hasilQuiz');
              if (savedHasil) {
                console.log("✅ Found saved hasil, navigating to hasil-akhir");
                navigate("/hasil-akhir");
              } else {
                console.log("⚠️ No saved hasil found, going back");
                navigate(-1);
              }
            }
          } catch (error) {
            console.error("❌ Error starting quiz session:", error);
            console.error("❌ Error stack:", error.stack);
            alert("Gagal memulai quiz. Silakan coba lagi.");
            navigate(-1);
          }
        } 
        // Materi flow (original flow with materi_id)
        else {
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

          // Fetch soal from API by materi_id
          console.log("🔍 Fetching soal for materi_id:", materiId);
          const response = await apiService.getSoalByMateri(materiId);
          console.log("📦 Materi API Response:", response);
          
          if (response.status === "success" && response.data && response.data.soal_list) {
            const soalFromAPI = response.data.soal_list;
            console.log("✅ Loaded soal from API:", soalFromAPI.length);
            
            if (soalFromAPI.length > 0) {
              // Transform backend format to frontend format and shuffle
              const transformedSoal = soalFromAPI.map((s, idx) => {
                // Determine jenis soal: if no pilihan, it's isian
                const hasOptions = s.pilihan_a || s.pilihan_b || s.pilihan_c || s.pilihan_d;
                const jenisSoal = hasOptions ? "pilihan_ganda" : "isian";
                
                return {
                  id: s.soal_id || idx,
                  soal: s.pertanyaan,
                  pertanyaan: s.pertanyaan,
                  opsi: [s.pilihan_a, s.pilihan_b, s.pilihan_c, s.pilihan_d].filter(Boolean),
                  jawaban: s.jawaban_benar,
                  jenis: jenisSoal,
                  gambar: null
                };
              });
              
              // Shuffle soal
              const shuffled = transformedSoal.sort(() => Math.random() - 0.5);
              console.log("✅ Soal shuffled:", shuffled.length);
              console.log("📝 Soal types:", shuffled.map(s => `${s.id}: ${s.jenis}`));
              console.log("📝 First soal jawaban:", shuffled[0]?.jawaban, "- Is array?", Array.isArray(shuffled[0]?.jawaban));
              setSoalListRandom(shuffled);
            } else {
              console.log("❌ soalFromAPI length is 0");
            }
          } else {
            console.log("❌ Tidak ada soal ditemukan");
          }
        }
      } catch (error) {
        console.error("❌ Error loading soal:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSoalFromAPI();
  }, [location.state, slug]); // Add slug to dependencies

  // Restore jawaban dari localStorage saat component mount atau refresh
  useEffect(() => {
    if (soalListRandom.length > 0) {
      const storageKey = getStorageKey();
      const savedJawaban = localStorage.getItem(storageKey);
      
      if (savedJawaban) {
        try {
          const parsedJawaban = JSON.parse(savedJawaban);
          console.log('🔄 Restoring jawaban from localStorage:', parsedJawaban);
          setJawabanUser(parsedJawaban);
          
          // Hitung jumlah soal yang sudah dijawab
          const answeredCount = Object.keys(parsedJawaban).length;
          console.log(`✅ Restored ${answeredCount} jawaban`);
        } catch (e) {
          console.error('❌ Error parsing saved jawaban:', e);
        }
      }
    }
  }, [soalListRandom]);

  // Save jawaban ke localStorage setiap kali jawabanUser berubah
  useEffect(() => {
    if (Object.keys(jawabanUser).length > 0) {
      const storageKey = getStorageKey();
      try {
        localStorage.setItem(storageKey, JSON.stringify(jawabanUser));
        console.log('💾 Jawaban saved to localStorage:', Object.keys(jawabanUser).length, 'soal');
      } catch (e) {
        console.error('❌ Error saving jawaban to localStorage:', e);
      }
    }
  }, [jawabanUser]);

  // Timer effect - sync dengan server
  useEffect(() => {
    if (soalListRandom.length === 0 || loading || !sessionId) return;

    if (timeLeft <= 0) {
      // Time's up - show popup
      setShowTimeUpPopup(true);
      return;
    }

    // Sync dengan server PERTAMA KALI saat component mount untuk handle refresh
    const syncWithServer = async () => {
      try {
        console.log("🔄 ========== TIMER SYNC START ==========");
        console.log("🔄 Session ID:", sessionId);
        
        const response = await apiService.getRemainingTime(sessionId);
        console.log("🔄 Server response:", response);
        
        if (response.status === "success" && response.data) {
          const serverSisaWaktu = response.data.sisa_waktu;
          
          // Update timer dengan nilai AKTUAL dari server (untuk handle refresh)
          console.log("🔄 Initial sync - Sisa waktu dari server:", serverSisaWaktu, "detik");
          console.log("🔄 Current timeLeft:", timeLeft, "detik");
          console.log("🔄 Difference:", Math.abs(timeLeft - serverSisaWaktu), "detik");
          
          setTimeLeft(serverSisaWaktu);
          
          if (response.data.time_expired) {
            console.log("⏰ WAKTU HABIS - Menampilkan popup");
            setShowTimeUpPopup(true);
            return;
          }
        } else {
          console.error("❌ Unexpected response format:", response);
        }
        console.log("🔄 ========== TIMER SYNC END ==========");
      } catch (error) {
        console.error("❌ Error initial sync:", error);
        console.error("❌ Error details:", error.message);
      }
    };
    
    // Jalankan sync pertama kali
    syncWithServer();

    // Update timer setiap detik (countdown lokal)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          console.log("⏰ Timer reached 0 - waktu habis!");
        }
        return newTime;
      });
    }, 1000);
    
    // Sync dengan server setiap 10 detik untuk akurasi (dikurangi frekuensi untuk performance)
    const syncTimer = setInterval(async () => {
      if (sessionId) {
        try {
          const response = await apiService.getRemainingTime(sessionId);
          if (response.status === "success" && response.data) {
            const serverSisaWaktu = response.data.sisa_waktu;
            
            // Only log if there's significant drift (>2 seconds)
            const drift = Math.abs(timeLeft - serverSisaWaktu);
            if (drift > 2) {
              console.log("🔄 Periodic sync - Correcting drift:", drift, "detik");
              console.log("🔄 Server time:", serverSisaWaktu, "Local time:", timeLeft);
            }
            
            setTimeLeft(serverSisaWaktu);
            
            if (response.data.time_expired || serverSisaWaktu <= 0) {
              console.log("⏰ Server reported time expired");
              clearInterval(timer);
              clearInterval(syncTimer);
              setShowTimeUpPopup(true);
            }
          }
        } catch (error) {
          console.error("❌ Error syncing time:", error);
        }
      }
    }, 10000); // Sync setiap 10 detik (lebih efficient)

    return () => {
      clearInterval(timer);
      clearInterval(syncTimer);
    };
  }, [sessionId, loading, soalListRandom.length]); // Removed timeLeft dari dependency

  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Calculate progress based on timer mode
  // PENTING: Gunakan waktuAwal (bukan totalWaktu) agar progress tidak reset setelah refresh
  // Fallback: waktuAwal -> totalWaktu -> waktuPerSoal untuk menghindari division by zero
  const maxTime = waktuAwal > 0 
    ? waktuAwal 
    : (totalWaktu > 0 ? totalWaktu : (timerMode === 'per_soal' ? waktuPerSoal : 60));
  
  // Progress = sisa waktu / total waktu (1 = penuh/hijau, 0 = habis/merah)
  // Menggunakan timeLeft (sisa waktu) dibagi maxTime (waktu awal)
  // Jika maxTime masih 0, gunakan 1 (100%) sebagai default agar tidak error
  const progress = maxTime > 0 && timeLeft >= 0 ? timeLeft / maxTime : 1;
  
  // Debug log untuk tracking (uncomment jika perlu debugging)
  // if (sessionId && timeLeft % 10 === 0) { // Log setiap 10 detik
  //   console.log("⏱️ Timer State:", { 
  //     timeLeft, 
  //     maxTime, 
  //     waktuAwal, 
  //     totalWaktu,
  //     progress: (progress * 100).toFixed(1) + '%',
  //     color: getTimerColor()
  //   });
  // }
  
  // strokeDashoffset untuk SVG circle: semakin kecil = lebih banyak terisi
  // Kita ingin: full time = full circle, no time = empty circle
  const strokeDashoffset = circumference - (progress * circumference);
  
  // Dynamic color based on remaining time percentage
  const getTimerColor = () => {
    // Pastikan progress valid (0-1)
    const validProgress = Math.max(0, Math.min(1, progress));
    
    if (validProgress > 0.5) return '#22c55e'; // Green (>50%)
    if (validProgress > 0.25) return '#eab308'; // Yellow (25-50%)
    return '#ef4444'; // Red (<25%)
  };
  
  const timerColor = getTimerColor();
  const isUrgent = progress <= 0.25; // Red zone
  
  // Format time display
  const formatTime = (seconds) => {
    if (timerMode === 'keseluruhan' && seconds > 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const pilihJawaban = (opsi) => {
    const newJawaban = { ...jawabanUser, [soalAktif.id]: opsi };
    setJawabanUser(newJawaban);
    console.log("✅ Jawaban dipilih:", opsi, "untuk soal ID:", soalAktif.id);
  };

  const handleNext = async () => {
    try {
      console.log('🔄 handleNext called - Current index:', currentIndex, 'Total soal:', soalListRandom.length);
      
      if (currentIndex < soalListRandom.length - 1) {
        const nextIndex = currentIndex + 1;
        console.log('➡️ Moving to next soal:', nextIndex);
        setCurrentIndex(nextIndex);
        
        // Update progress ke server
        if (sessionId) {
          try {
            await apiService.updateQuizProgress(sessionId, nextIndex);
            console.log('✅ Progress updated to index:', nextIndex);
          } catch (error) {
            console.error("❌ Error updating progress:", error);
          }
        }
        
        // Reset timer untuk soal berikutnya HANYA jika mode per_soal
        if (timerMode === 'per_soal') {
          setTimeLeft(waktuPerSoal);
          console.log('⏱️ Timer reset for next soal:', waktuPerSoal, 'seconds');
        }
      } else {
        // Soal terakhir, tampilkan popup konfirmasi
        console.log('🏁 Last soal reached - Showing confirmation popup');
        setShowConfirmPopup(true);
        console.log('✅ Confirmation popup state set to true');
      }
    } catch (error) {
      console.error('❌ ERROR in handleNext:', error);
      console.error('❌ Error stack:', error.stack);
      // Don't navigate away on error, just log it
    }
  };

  const handleSelesai = async () => {
    console.log('🎯 ========== handleSelesai CALLED ==========');
    console.log('🎯 Function triggered from:', new Error().stack?.split('\n')[2]);
    console.log('🎯 Current location:', window.location.pathname);
    
    try {
      console.log('🎯 ========== STARTING QUIZ SUBMISSION ==========');
      console.log('📊 Total soal:', soalListRandom.length);
      console.log('✍️ Jawaban user:', jawabanUser);
      console.log('⏱️ Total waktu:', totalWaktu, 'detik');
      console.log('⏱️ Sisa waktu:', timeLeft, 'detik');
      console.log('📍 Materi slug:', materiSlug);
      console.log('📂 Kategori:', materi?.kategori);
      
      // Calculate results dengan validasi yang ketat
      const benar = soalListRandom.filter((soal) => {
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
        
        if (soal.jenis === "isian" && Array.isArray(correctAnswer)) {
          const normalizedUserAnswer = cleanUserAnswer.toLowerCase();
          return correctAnswer.some(jawab => {
            const normalizedCorrectAnswer = jawab?.trim().toLowerCase();
            return normalizedCorrectAnswer && normalizedUserAnswer === normalizedCorrectAnswer;
          });
        }
        
        // Single jawaban
        const normalizedCorrectAnswer = correctAnswer?.trim();
        if (!normalizedCorrectAnswer) return false;
        
        return cleanUserAnswer === normalizedCorrectAnswer;
      }).length;

      console.log('✅ Jawaban benar:', benar, 'dari', soalListRandom.length);
      console.log('📊 Skor:', Math.round((benar / soalListRandom.length) * 100), '%');

      // Hitung waktu pengerjaan dalam detik
      let waktuPengerjaanDetik = totalWaktu - timeLeft;
      
      // 🔥 CRITICAL FIX: Ensure waktu_pengerjaan is valid
      console.log('⏱️ DEBUG - totalWaktu:', totalWaktu, 'timeLeft:', timeLeft);
      console.log('⏱️ DEBUG - waktuPengerjaanDetik (calculated):', waktuPengerjaanDetik);
      
      // Fallback: jika waktu tidak valid, gunakan waktu default atau actual elapsed time
      if (!waktuPengerjaanDetik || waktuPengerjaanDetik <= 0 || isNaN(waktuPengerjaanDetik)) {
        console.warn('⚠️ Invalid waktu_pengerjaan, using fallback');
        // Fallback: gunakan totalWaktu jika ada, atau 60 detik
        waktuPengerjaanDetik = totalWaktu > 0 ? totalWaktu : 60;
      }
      
      console.log('⏱️ Waktu pengerjaan (final):', waktuPengerjaanDetik, 'detik');
      
      // Get data from location.state
      const nama_peserta = location.state?.nama || 'Anonymous';
      const pin_code = location.state?.pin;
      const quizData = location.state?.quizData;
      const kumpulan_soal_id = quizData?.kumpulan_soal_id;

      if (kumpulan_soal_id) {
        // Build jawaban detail array dengan validasi yang sama
        const jawabanDetail = soalListRandom.map((soal) => {
          const userAnswer = jawabanUser[soal.id] || '';
          const correctAnswer = soal.jawaban;
          let isCorrect = false;
          
          // Validasi: jawaban tidak boleh kosong atau karakter spesial
          const cleanUserAnswer = userAnswer.trim();
          if (!cleanUserAnswer || cleanUserAnswer === '-' || !correctAnswer) {
            isCorrect = false;
          } else if (soal.jenis === "pilihan_ganda") {
            isCorrect = userAnswer === correctAnswer;
          } else if (soal.jenis === "isian" && Array.isArray(correctAnswer)) {
            const normalizedUserAnswer = cleanUserAnswer.toLowerCase();
            isCorrect = correctAnswer.some(jawab => {
              const normalizedCorrectAnswer = jawab?.trim().toLowerCase();
              return normalizedCorrectAnswer && normalizedUserAnswer === normalizedCorrectAnswer;
            });
          } else {
            const normalizedCorrectAnswer = correctAnswer?.trim();
            isCorrect = normalizedCorrectAnswer && cleanUserAnswer === normalizedCorrectAnswer;
          }
          
          return {
            soal_id: soal.id,
            jawaban: userAnswer,
            is_correct: isCorrect
          };
        });

        const submitData = {
          session_id: sessionId,
          nama_peserta,
          kumpulan_soal_id,
          skor: Math.round((benar / soalListRandom.length) * 100),
          jawaban_benar: benar,
          total_soal: soalListRandom.length,
          waktu_pengerjaan: waktuPengerjaanDetik,
          pin_code,
          jawaban_detail: jawabanDetail
        };

        console.log('📤 Submitting quiz data to backend:', submitData);
        
        try {
          const response = await apiService.submitQuiz(submitData);
          console.log('✅ Quiz submission response:', response);
          
          if (response.status === 'error') {
            console.error('❌ Backend returned error:', response.message);
            // Don't alert - it will block the flow, just log
            console.warn('⚠️ Result will be displayed but not saved to database');
          } else {
            console.log('✅ Quiz result saved successfully with hasil_id:', response.data?.hasil_id);
          }
        } catch (backendError) {
          console.error('❌ Backend submission failed:', backendError);
          console.warn('⚠️ Continuing with local display only');
          // Don't throw - continue to show hasil
        }
      }

      // Prepare hasil data dengan validasi lengkap
      const hasilData = {
        materi: materiSlug || materi?.materi || 'Quiz',
        kategori: materi?.kategori || 'Kategori',
        soalList: soalListRandom,
        jawabanUser,
        skor: Math.round((benar / soalListRandom.length) * 100),
        benar: benar,
        total: soalListRandom.length
      };
      
      // IMPORTANT: Preserve isPeserta flag for FlexibleRoute
      const isPeserta = location.state?.isPeserta === true;
      console.log('📋 isPeserta flag:', isPeserta, '(from location.state)');

      console.log('📦 Hasil data prepared:', {
        materi: hasilData.materi,
        kategori: hasilData.kategori,
        soalCount: hasilData.soalList.length,
        jawabanCount: Object.keys(hasilData.jawabanUser).length,
        skor: hasilData.skor,
        benar: hasilData.benar
      });

      // Validasi data sebelum save
      if (!hasilData.soalList || hasilData.soalList.length === 0) {
        console.error('❌ ERROR: soalList is empty!');
        alert('Error: Data soal tidak ditemukan. Silakan coba lagi.');
        return;
      }

      // Save to localStorage as backup
      try {
        localStorage.setItem('hasilQuiz', JSON.stringify(hasilData));
        console.log('✅ Hasil quiz saved to localStorage successfully');
        console.log('💾 Data size:', new Blob([JSON.stringify(hasilData)]).size, 'bytes');
        
        // Clear jawaban temp storage karena quiz sudah selesai
        const storageKey = getStorageKey();
        localStorage.removeItem(storageKey);
        console.log('🗑️ Cleared temporary jawaban from localStorage');
      } catch (storageError) {
        console.error('❌ Failed to save to localStorage:', storageError);
      }

      // Validate navigation is safe
      if (!hasilData || !hasilData.soalList || hasilData.soalList.length === 0) {
        console.error('❌ CRITICAL: Cannot navigate - hasilData is invalid');
        alert('Error: Data hasil tidak valid. Silakan coba lagi.');
        return;
      }

      // Navigate with results
      console.log('🚀 Navigating to /hasil-akhir with data...');
      console.log('🚀 Navigation target: /hasil-akhir');
      console.log('🚀 Navigation state:', { hasil: hasilData });
      
      try {
        // CRITICAL: Pass isPeserta flag to allow FlexibleRoute access
        const navigationState = {
          hasil: hasilData,
          isPeserta: isPeserta, // Preserve peserta flag for route access
          nama: location.state?.nama // Preserve nama for reference
        };
        
        console.log('🚀 Navigation state:', navigationState);
        
        navigate("/hasil-akhir", {
          state: navigationState,
          replace: false
        });
        console.log('✅ Navigation initiated successfully');
      } catch (navError) {
        console.error('❌ Navigation failed:', navError);
        alert('Error navigasi. Periksa console untuk detail.');
      }
      
      console.log('🎯 ========== QUIZ SUBMISSION COMPLETE ==========');
    } catch (error) {
      console.error('❌ ========== ERROR IN QUIZ SUBMISSION ==========');
      console.error('❌ Error details:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Calculate basic results for fallback
      const benar = soalListRandom.filter((soal) => {
        const userAnswer = jawabanUser[soal.id];
        const correctAnswer = soal.jawaban;
        if (!userAnswer || !correctAnswer) return false;
        const cleanUserAnswer = userAnswer.trim();
        if (!cleanUserAnswer || cleanUserAnswer === '-') return false;
        if (soal.jenis === "pilihan_ganda") return userAnswer === correctAnswer;
        if (Array.isArray(correctAnswer)) {
          return correctAnswer.some(jawab => jawab?.trim().toLowerCase() === cleanUserAnswer.toLowerCase());
        }
        return cleanUserAnswer === correctAnswer?.trim();
      }).length;
      
      // Prepare hasil data (fallback)
      const hasilData = {
        materi: materiSlug || materi?.materi || 'Quiz',
        kategori: materi?.kategori || 'Kategori',
        soalList: soalListRandom,
        jawabanUser,
        skor: Math.round((benar / soalListRandom.length) * 100),
        benar: benar,
        total: soalListRandom.length,
        isOffline: true
      };

      console.log('⚠️ Using fallback data:', hasilData);

      // Save to localStorage even if backend submission fails
      try {
        localStorage.setItem('hasilQuiz', JSON.stringify(hasilData));
        console.log('✅ Hasil quiz saved to localStorage (fallback mode)');
      } catch (storageError) {
        console.error('❌ Critical: Failed to save to localStorage:', storageError);
        alert('Error kritis: Tidak dapat menyimpan hasil. Data mungkin hilang.');
      }

      // Still navigate even if submission fails
      console.log('🚀 Navigating to /hasil-akhir (fallback mode)...');
      
      // CRITICAL: Pass isPeserta flag for FlexibleRoute access
      const isPeserta = location.state?.isPeserta === true;
      const navigationState = {
        hasil: hasilData,
        isPeserta: isPeserta,
        nama: location.state?.nama
      };
      
      console.log('🚀 Navigation state (fallback):', navigationState);
      
      navigate("/hasil-akhir", {
        state: navigationState,
        replace: false
      });
    }
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
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 flex items-center justify-center p-6">
        <SoalBelumTersedia />
      </div>
    );
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
          {soalListRandom.length > 0 && sessionId && (
            <div className="flex items-center gap-3">
              <svg height={radius * 2} width={radius * 2} className={isUrgent ? "animate-pulse" : ""}>
                {/* Background circle */}
                <circle
                  stroke="#e5e7eb"
                  fill="white"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                {/* Progress circle with dynamic color */}
                <circle
                  stroke={timerColor}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{
                    strokeDashoffset,
                    transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
                    filter: isUrgent ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))" : "drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))",
                    transform: "rotate(-90deg)",
                    transformOrigin: "50% 50%"
                  }}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                {/* Timer text */}
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="text-sm font-bold"
                  style={{ fill: timerColor }}
                >
                  {formatTime(timeLeft)}
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
              <span className="text-sm font-bold text-gray-700">
                Soal {currentIndex + 1} dari {soalListRandom.length}
                <span className="ml-2 text-xs text-green-600 font-semibold">
                  ({Object.keys(jawabanUser).length} dijawab)
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-orange-600">
                  {Math.round((currentIndex + 1) / soalListRandom.length * 100)}% Selesai
                </span>
                {/* Timer Progress Indicator */}
                {sessionId && (
                  <span 
                    className="text-xs font-bold px-2 py-1 rounded-full transition-colors duration-500"
                    style={{ 
                      backgroundColor: timerColor + '20',
                      color: timerColor 
                    }}
                  >
                    ⏱️ {Math.round(progress * 100)}%
                  </span>
                )}
              </div>
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 transition-all ${
                  jawabanUser[soalAktif.id] 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-orange-500 to-yellow-500'
                }`}>
                  {jawabanUser[soalAktif.id] ? '✓' : currentIndex + 1}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-800 leading-relaxed">
                    {soalAktif.soal}
                  </p>
                  {jawabanUser[soalAktif.id] && (
                    <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      ✓ Sudah dijawab
                    </span>
                  )}
                </div>
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

      {/* Popup Waktu Habis */}
      {showTimeUpPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-red-300 transform transition-all duration-300 animate-scaleIn">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-5xl">⏰</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 mb-3">
              Waktu Habis!
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6 font-medium">
              Waktu pengerjaan quiz telah berakhir. Quiz Anda akan otomatis dikumpulkan sekarang.
            </p>

            {/* Info */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-2xl">ℹ️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-1">Informasi:</p>
                  <p className="text-xs text-red-700">
                    Semua jawaban yang telah Anda isi akan disimpan dan langsung diperiksa. Terima kasih telah mengerjakan quiz ini!
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleSelesai}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-lg">✓ Kumpulkan Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
