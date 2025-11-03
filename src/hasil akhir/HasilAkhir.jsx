import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function HasilAkhir() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    // Ambil dari state route jika ada
    if (location.state && location.state.hasil) {
      setHasil(location.state.hasil);
    } else {
      // Ambil dari localStorage
      const data = JSON.parse(localStorage.getItem("hasilQuiz"));
      if (data) setHasil(data);
    }
  }, [location.state]);

  if (!hasil) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Tidak ada hasil ditemukan.</h1>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const { soalList, jawabanUser, materi, kategori } = hasil;

  // Hitung skor → PG dan isian/essay jika jawaban cocok kunci
  const benar = soalList.filter((soal) => {
    if (soal.jenis === "pilihan_ganda") return jawabanUser[soal.id] === soal.jawaban;
    return jawabanUser[soal.id]?.trim() === (soal.jawaban?.trim() || ""); 
  }).length;

  const total = soalList.length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
       <h1 className="text-2xl font-bold text-center">Hasil Akhir</h1>
  <p className="text-gray-700 mt-1 text-center font-semibold">
    {kategori} ({materi})
  </p>
      <p className="mb-5 mt-5 text-center font-semibold text-xl">
        Skor: <span className="font-bold">{benar} / {total}</span>
      </p>

      <div className="space-y-6">
        {soalList.map((soal) => {
          const jawabanBenar = soal.jawaban || "-";
          const jawabanKamu = jawabanUser[soal.id] || "-";
          const isCorrect =
            soal.jenis === "pilihan_ganda"
              ? jawabanKamu === jawabanBenar
              : jawabanKamu.trim() === jawabanBenar.trim();

          return (
            <div
              key={soal.id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <p className="font-semibold mb-2">
                {soal.id}. {soal.soal}
              </p>
              {soal.gambar && (
                <img
                  src={soal.gambar}
                  alt="Soal"
                  className="w-32 h-32 object-cover mb-2 rounded"
                />
              )}
              <p className={`mb-1 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                Jawaban Kamu: {jawabanKamu}
              </p>
              <p className="text-green-700">Jawaban Benar: {jawabanBenar}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
