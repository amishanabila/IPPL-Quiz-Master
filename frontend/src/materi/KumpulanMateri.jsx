// src/pages/KumpulanMateri.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import Kategori from "../kategori/Kategori";
import HapusSoalPopup from "../popup/HapusSoalPopup";
import { apiService } from "../services/api";

export default function KumpulanMateri() {
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [materiList, setMateriList] = useState([]);
  const [allKategori, setAllKategori] = useState([]);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [materiToDelete, setMateriToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // fungsi bikin slug dari nama materi (contoh: "Bangun Datar" -> "bangun-datar")
  const toSlug = (text) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Load kategori from API
  useEffect(() => {
    const loadKategori = async () => {
      try {
        const response = await apiService.getKategori();
        if (response.status === "success" && response.data) {
          setAllKategori(response.data);
        }
      } catch (error) {
        console.error("❌ Error loading kategori:", error);
      }
    };
    loadKategori();
  }, []);

  // Load materi from API
  useEffect(() => {
    const loadMateri = async () => {
      setLoading(true);
      try {
        let response;
        if (kategoriAktif === "Semua") {
          response = await apiService.getMateri();
        } else {
          // Find kategori_id by name
          const kategori = allKategori.find(k => k.nama_kategori === kategoriAktif);
          if (kategori) {
            response = await apiService.getMateri(kategori.id);
          } else {
            response = { status: "success", data: [] };
          }
        }

        if (response.status === "success" && response.data) {
          console.log("📊 Raw materi data from API:", response.data);
          
          // Transform API data to component format
          const materiFromAPI = await Promise.all(response.data.map(async (m) => {
            // Fetch kumpulan_soal_id for each materi
            let kumpulanSoalId = null;
            let jumlahSoal = 0;
            try {
              const soalResponse = await apiService.getSoalByMateri(m.materi_id);
              console.log(`📝 Soal for materi ${m.materi_id} (${m.judul}):`, soalResponse);
              
              if (soalResponse.status === "success" && soalResponse.data) {
                kumpulanSoalId = soalResponse.data.kumpulan_soal_id;
                jumlahSoal = soalResponse.data.soal_list?.length || 0;
                console.log(`✅ Found ${jumlahSoal} soal for materi ${m.materi_id}`);
              } else {
                console.log(`⚠️ No soal found for materi ${m.materi_id} (${m.judul})`);
              }
            } catch (err) {
              console.error(`❌ Error fetching soal for materi ${m.materi_id} (${m.judul}):`, err);
            }

            return {
              materi_id: m.materi_id,
              kumpulan_soal_id: kumpulanSoalId,
              materi: m.judul,
              kategori_id: m.kategori_id,
              kategori: allKategori.find(k => k.id === m.kategori_id)?.nama_kategori || "Unknown",
              jumlahSoal: jumlahSoal,
              createdAt: m.created_at
            };
          }));
          
          // Sort by createdAt (newest first)
          const sortedMateri = materiFromAPI.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          });

          setMateriList(sortedMateri);
          console.log("✅ Loaded materi from API:", sortedMateri.length, "items");
        }
      } catch (error) {
        console.error("❌ Error loading materi:", error);
        setMateriList([]);
      } finally {
        setLoading(false);
      }
    };

    if (allKategori.length > 0 || kategoriAktif === "Semua") {
      loadMateri();
    }
  }, [kategoriAktif, allKategori]);

  // Get latest 3 materi
  const soalTerbaru = materiList.slice(0, 3);

  // Toggle menu three-dot
  const toggleMenu = (e, index) => {
    e.stopPropagation();
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    if (openMenuIndex !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuIndex]);

  // Handler untuk lihat soal (view only)
  const handleLihatSoal = (e, materiData) => {
    e.stopPropagation();
    setOpenMenuIndex(null);
    // Pass materi_id via state
    navigate(`/lihat-soal/${toSlug(materiData.materi)}`, { 
      state: { 
        materi_id: materiData.materi_id,
        kumpulan_soal_id: materiData.kumpulan_soal_id,
        materi: materiData.materi,
        kategori: materiData.kategori
      } 
    });
  };

  // Handler untuk edit soal
  const handleEditSoal = async (e, materiData) => {
    e.stopPropagation();
    setOpenMenuIndex(null);
    
    console.log("📝 Navigating to edit mode with data:", materiData);
    
    // Navigate dengan state untuk edit mode
    navigate("/buat-soal", { 
      state: { 
        kumpulan_soal_id: materiData.kumpulan_soal_id,
        materi_id: materiData.materi_id,
        kategori_id: materiData.kategori_id,
        materi: materiData.materi,
        kategori: materiData.kategori
      } 
    });
  };

  // Handler untuk hapus soal
  const handleHapusSoal = (e, materi) => {
    e.stopPropagation();
    setOpenMenuIndex(null);
    setMateriToDelete(materi);
    setShowDeletePopup(true);
  };

  // Konfirmasi hapus soal
  const confirmDeleteSoal = async () => {
    if (!materiToDelete) return;

    console.log("🗑️ Menghapus materi:", materiToDelete);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert("Anda harus login untuk menghapus materi");
        return;
      }

      // Delete materi via API
      const response = await apiService.deleteMateri(materiToDelete.materi_id, token);
      
      if (response.status === "success") {
        console.log("✅ Materi berhasil dihapus dari backend");
        
        // Close popup
        setShowDeletePopup(false);
        setMateriToDelete(null);
        
        // Reload materi list
        setKategoriAktif(prev => {
          const temp = prev + " ";
          setTimeout(() => setKategoriAktif(prev), 10);
          return temp;
        });
      } else {
        throw new Error(response.message || "Gagal menghapus materi");
      }
    } catch (error) {
      console.error("❌ Error deleting materi:", error);
      alert(error.message || "Terjadi kesalahan saat menghapus materi");
      setShowDeletePopup(false);
      setMateriToDelete(null);
    }
  };

  return (
    <div>
      {/* Komponen Kategori */}
      <Kategori
        onPilihKategori={setKategoriAktif}
        kategoriAktif={kategoriAktif}
      />

      <hr className="my-4" />

      {/* Soal Terbaru Saya */}
      {soalTerbaru.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-600">⭐</span>
            Soal Terbaru Saya
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {soalTerbaru.map((m, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl shadow-md p-4 flex flex-col justify-between transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl relative"
              >
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Baru
                </span>
                
                {/* Three-dot menu */}
                <div className="absolute top-2 right-14">
                  <button
                    onClick={(e) => toggleMenu(e, `terbaru-${idx}`)}
                    className="p-1 hover:bg-blue-200 rounded-full transition"
                  >
                    <MoreVertical size={20} className="text-blue-700" />
                  </button>
                  
                  {openMenuIndex === `terbaru-${idx}` && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <button
                        onClick={(e) => handleLihatSoal(e, m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                      >
                        <Eye size={16} className="text-blue-600" />
                        Lihat Soal
                      </button>
                      <button
                        onClick={(e) => handleEditSoal(e, m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit size={16} className="text-green-600" />
                        Edit Soal
                      </button>
                      <button
                        onClick={(e) => handleHapusSoal(e, m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-b-lg text-red-600"
                      >
                        <Trash2 size={16} />
                        Hapus Soal
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-1 pr-24 text-blue-900">{m.materi}</h3>
                  <p className="text-blue-600 text-sm font-medium">{m.kategori}</p>
                </div>
                {m.jumlahSoal && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">
                      📝 {m.jumlahSoal} soal
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <hr className="my-6" />
        </div>
      )}

      {/* Daftar Materi */}
      <div className="px-4 mb-2">
        <h2 className="text-xl font-bold mb-4">
          {kategoriAktif === "Semua" ? "Semua Materi" : `Materi ${kategoriAktif}`}
        </h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Loading materi...</div>
        </div>
      ) : (
        <div className="grid gap-6 p-4 grid-cols-2 xs:grid-cols-1 lg:grid-cols-3">
          {materiList.length > 0 ? (
            materiList.map((m, idx) => {
              const isUserCreated = true; // All materi from API are user-created
            
            return (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg relative"
              >
                {isUserCreated && (
                  <>
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Soal Saya
                    </span>
                    
                    {/* Three-dot menu untuk user created */}
                    <div className="absolute top-2 right-20">
                      <button
                        onClick={(e) => toggleMenu(e, `all-${idx}`)}
                        className="p-1 hover:bg-gray-200 rounded-full transition"
                      >
                        <MoreVertical size={20} className="text-gray-700" />
                      </button>
                      
                      {openMenuIndex === `all-${idx}` && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                          <button
                            onClick={(e) => handleLihatSoal(e, m)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                          >
                            <Eye size={16} className="text-blue-600" />
                            Lihat Soal
                          </button>
                          <button
                            onClick={(e) => handleEditSoal(e, m)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit size={16} className="text-green-600" />
                            Edit Soal
                          </button>
                          <button
                            onClick={(e) => handleHapusSoal(e, m)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 rounded-b-lg text-red-600"
                          >
                            <Trash2 size={16} />
                            Hapus Soal
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div>
                  <h3 className="font-bold text-lg mb-1 pr-20">{m.materi}</h3>
                  <p className="text-gray-500 text-sm">{m.kategori}</p>
                </div>
                {m.jumlahSoal > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      📝 {m.jumlahSoal} soal
                    </p>
                  </div>
                )}
              </div>
            );
          })
            ) : (
            <p className="text-center text-gray-500 col-span-full">Tidak ada materi untuk kategori ini.</p>
          )}
        </div>
      )}      {/* Popup Hapus Soal */}
      {showDeletePopup && materiToDelete && (
        <HapusSoalPopup
          materi={materiToDelete.materi}
          onConfirm={confirmDeleteSoal}
          onCancel={() => {
            setShowDeletePopup(false);
            setMateriToDelete(null);
          }}
        />
      )}
    </div>
  );
}
