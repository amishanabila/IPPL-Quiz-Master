// src/kategori/Kategori.jsx
import React from "react";
import { apiService } from "../services/api";

export const kategoriList = [
  { nama: "Semua", icon: "🏠" }
];

export default function Kategori({ onPilihKategori, kategoriAktif }) {
  // Fetch kategori from backend API
  const [allKategori, setAllKategori] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadKategoriFromAPI = async () => {
      try {
        const response = await apiService.getKategori();
        if (response.status === "success" && response.data) {
          // Transform backend data to component format with default icons
          const kategoriFromAPI = response.data.map(kat => ({
            nama: kat.nama_kategori,
            icon: getIconForKategori(kat.nama_kategori),
            id: kat.id
          }));
          setAllKategori(kategoriFromAPI);
          console.log("✅ Loaded kategori from API:", kategoriFromAPI);
        }
      } catch (error) {
        console.error("❌ Error loading kategori:", error);
        setAllKategori([]); // Fallback to empty array if API fails
      } finally {
        setLoading(false);
      }
    };
    
    loadKategoriFromAPI();
    
    // Listen for custom event to reload when new kategori is created
    const handleKategoriUpdate = () => loadKategoriFromAPI();
    window.addEventListener("customKategoriUpdated", handleKategoriUpdate);
    
    return () => {
      window.removeEventListener("customKategoriUpdated", handleKategoriUpdate);
    };
  }, []);

  // Helper function to assign icons based on kategori name
  const getIconForKategori = (nama) => {
    const namaLower = nama.toLowerCase();
    if (namaLower.includes("matematik")) return "📐";
    if (namaLower.includes("indonesia")) return "📖";
    if (namaLower.includes("inggris")) return "🗣";
    if (namaLower.includes("ipa") || namaLower.includes("sains")) return "🔬";
    if (namaLower.includes("ips") || namaLower.includes("sosial")) return "🌍";
    if (namaLower.includes("pkn") || namaLower.includes("kewarganegaraan")) return "🏛";
    if (namaLower.includes("seni") || namaLower.includes("budaya")) return "🎨";
    if (namaLower.includes("olahraga") || namaLower.includes("penjaskes")) return "⚽";
    return "📚"; // Default icon for custom categories
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="text-gray-500">Loading kategori...</div>
      </div>
    );
  }

  // Combine "Semua" with API kategori
  const allKategoriToShow = [...kategoriList, ...allKategori];

  return (
    <div className="flex justify-center flex-wrap gap-4 p-4">
      {allKategoriToShow.map((kat, idx) => {
        const namaBersih = kat.nama.replace("\n", "");
        const aktif = kategoriAktif === namaBersih;
        return (
          <div
            key={kat.id || idx}
            onClick={() => onPilihKategori(namaBersih)}
            className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center cursor-pointer shadow-xl transform transition-all duration-300 relative overflow-hidden group
              ${aktif ? "bg-gradient-to-br from-green-400 to-emerald-500 border-4 border-white scale-110 shadow-2xl text-white" : "bg-white/90 backdrop-blur-sm border-2 border-orange-200 hover:border-orange-400 hover:scale-110 hover:shadow-2xl"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-yellow-400/0 group-hover:from-orange-400/20 group-hover:to-yellow-400/20 transition-all duration-300"></div>
            <span className="text-3xl relative z-10 transform group-hover:scale-110 transition-transform duration-300">{kat.icon}</span>
            <p className={`mt-2 font-medium text-center whitespace-pre-wrap text-sm relative z-10 ${aktif ? "text-white font-bold" : "text-gray-700 group-hover:text-orange-600"}`}>
              {kat.nama}
            </p>
          </div>
        );
      })}
    </div>
  );
}
