// src/pages/KumpulanMateri.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dataMateri from "../materi/DataMateri";
import Kategori from "../kategori/Kategori";

export default function KumpulanMateri() {
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [materiList, setMateriList] = useState([]);
  const navigate = useNavigate();

  // fungsi bikin slug dari nama materi (contoh: "Bangun Datar" -> "bangun-datar")
  const toSlug = (text) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  useEffect(() => {
    let listDefault = [];

    if (kategoriAktif === "Semua") {
      listDefault = Object.values(dataMateri).flat();
    } else {
      const key =
        kategoriAktif.replace(/\s/g, "") === "BahasaIndonesia"
          ? "BahasaIndonesia"
          : kategoriAktif.replace(/\s/g, "") === "BahasaInggris"
          ? "BahasaInggris"
          : kategoriAktif;
      listDefault = dataMateri[key] || [];
    }

    // acak materi setiap refresh / perubahan kategori
    const listAcak = [...listDefault].sort(() => Math.random() - 0.5);

    setMateriList(listAcak);
  }, [kategoriAktif]);

  return (
    <div>
      {/* Komponen Kategori */}
      <Kategori
        onPilihKategori={setKategoriAktif}
        kategoriAktif={kategoriAktif}
      />

      <hr className="my-4" />

      {/* Daftar Materi */}
      <div className="grid gap-6 p-4 grid-cols-2 xs:grid-cols-1 lg:grid-cols-3">
        {materiList.length > 0 ? (
          materiList.map((m, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-start cursor-pointer transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate(`/soal/${toSlug(m.materi)}`)}
            >
              <h3 className="font-bold text-lg mb-1">{m.materi}</h3>
              <p className="text-gray-500 text-sm">{m.kategori}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">Tidak ada materi untuk kategori ini.</p>
        )}
      </div>
    </div>
  );
}
