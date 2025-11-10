// src/kategori/Kategori.jsx
import React from "react";

export const kategoriList = [
  { nama: "Semua", icon: "🏠" },
  { nama: "Matematika", icon: "📐" },
  { nama: "Bahasa\nIndonesia", icon: "📖" },
  { nama: "Bahasa\nInggris", icon: "🗣" },
  { nama: "IPA", icon: "🔬" },
  { nama: "IPS", icon: "🌍" },
  { nama: "PKN", icon: "🏛" },
  { nama: "Seni Budaya", icon: "🎨" },
  { nama: "Olahraga", icon: "⚽" },
];

export default function Kategori({ onPilihKategori, kategoriAktif }) {
  return (
    <div className="flex justify-center flex-wrap gap-4 p-4">
      {kategoriList.map((kat, idx) => {
        const namaBersih = kat.nama.replace("\n", "");
        const aktif = kategoriAktif === namaBersih;
        return (
          <div
            key={idx}
            onClick={() => onPilihKategori(namaBersih)}
            className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center cursor-pointer shadow-lg transform transition duration-200
              ${aktif ? "bg-green-200 border-2 border-green-500 scale-105" : "bg-white hover:bg-emerald-50 hover:scale-105"}`}
          >
            <span className="text-3xl">{kat.icon}</span>
            <p className="mt-2 font-medium text-center whitespace-pre-wrap text-sm">
              {kat.nama}
            </p>
          </div>
        );
      })}
    </div>
  );
}
