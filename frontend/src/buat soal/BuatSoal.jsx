// src/pages/BuatSoal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormBuatSoal from "../buat soal/FormBuatSoal";
import { kategoriList } from "../kategori/Kategori";
import BuatSoalBerhasil from "../popup/BuatSoalBerhasil";
import Footer from "../footer/Footer";
import { Loader2 } from "lucide-react"; // Loader icon

export default function BuatSoal() {
  const navigate = useNavigate();
  const [kategori, setKategori] = useState("");
  const [materi, setMateri] = useState("");
  const [jumlahSoal, setJumlahSoal] = useState(1);
  const [soalList, setSoalList] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false); // 🔥 loading state

  // generate template soal
  const handleGenerateSoal = () => {
    let newErrors = {};
    if (!kategori) newErrors.kategori = "Kategori wajib dipilih";
    if (!materi.trim()) newErrors.materi = "Materi wajib diisi";
    if (jumlahSoal < 1) newErrors.jumlahSoal = "Jumlah soal minimal 1";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newSoal = Array.from({ length: jumlahSoal }, (_, i) => ({
      id: i + 1,
      soal: "",
      gambar: null,
      jenis: "pilihan_ganda",
      opsi: ["", ""],
      jawaban: "",
      jawabanHuruf: "",
    }));

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
    const updated = [...soalList];
    updated[index].gambar = URL.createObjectURL(file);
    setSoalList(updated);
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
    } else {
      updated[index].opsi = [];
      updated[index].jawaban = "";
      updated[index].jawabanHuruf = "";
    }
    setSoalList(updated);
  };

  const handleJawabanChange = (index, value) => {
    const updated = [...soalList];
    updated[index].jawaban = value.text;
    updated[index].jawabanHuruf = value.huruf;
    setSoalList(updated);
  };

  // validasi
  const validateForm = () => {
    let newErrors = {};

    if (!kategori) newErrors.kategori = "Kategori wajib dipilih";
    if (!materi.trim()) newErrors.materi = "Materi wajib diisi";

    const soalErrors = soalList.map((soal) => {
      let err = {};
      if (!soal.soal.trim()) err.soal = "Pertanyaan wajib diisi";

      if (soal.jenis === "pilihan_ganda") {
        err.opsi = soal.opsi.map((o) =>
          !o.trim() ? "Opsi wajib diisi" : ""
        );
        if (!soal.jawabanHuruf && !soal.jawaban) {
          err.jawaban = "Jawaban benar wajib dipilih";
        }
      }

      if (soal.jenis === "isian" || soal.jenis === "essay") {
        if (!soal.jawaban.trim()) {
          err.jawaban = "Jawaban wajib diisi";
        }
      }

      return err;
    });

    newErrors.soalList = soalErrors;
    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0 ||
      soalErrors.every((err) => Object.keys(err).length === 0)
    );
  };

  // simpan
  const handleSimpan = () => {
    if (!validateForm()) return;

    setLoading(true); // mulai loading

    setTimeout(() => {
      // simpan ke localStorage
      const materiBaru = { materi, kategori };
      const materiTersimpan = JSON.parse(localStorage.getItem("materi")) || [];

      const sudahAda = materiTersimpan.some((m) => m.materi === materi);
      if (!sudahAda) {
        localStorage.setItem(
          "materi",
          JSON.stringify([...materiTersimpan, materiBaru])
        );
      }

      const soalTersimpan = JSON.parse(localStorage.getItem("soal")) || {};
      localStorage.setItem(
        "soal",
        JSON.stringify({ ...soalTersimpan, [materi]: soalList })
      );

      setLoading(false); // stop loading
      setShowPopup(true); // tampilkan popup
    }, 1000); // delay biar Loader2 kelihatan
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 md:p-6 max-w-4xl mx-auto flex-1 w-full">
        {/* Tombol Kembali */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 px-3 py-2 bg-gray-300 rounded hover:bg-gray-500 hover:text-white z-10 font-semibold"
        >
          Kembali
        </button>
      <h1 className="text-2xl font-bold mb-6 text-center">
        Buat Soal Versi Kamu
      </h1>

      {/* Pilih kategori */}
      <div className="mb-4">
        <label className="font-semibold">Pilih Kategori:</label>
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className={`border p-2 rounded w-full ${
            errors.kategori
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300"
          }`}
        >
          <option value="">-- Pilih Kategori --</option>
          {kategoriList
            .filter((k) => k.nama !== "Semua")
            .map((k, idx) => (
              <option key={idx} value={k.nama.replace("\n", "")}>
                {k.nama.replace("\n", "")}
              </option>
            ))}
        </select>
        {errors.kategori && (
          <p className="text-red-500 text-sm mt-1">{errors.kategori}</p>
        )}
      </div>

      {/* Materi */}
      <div className="mb-4">
        <label className="font-semibold">Materi:</label>
        <input
          type="text"
          value={materi}
          onChange={(e) => setMateri(e.target.value)}
          className={`border p-2 rounded w-full ${
            errors.materi
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300"
          }`}
          placeholder="Contoh: Bangun Datar"
        />
        {errors.materi && (
          <p className="text-red-500 text-sm mt-1">{errors.materi}</p>
        )}
      </div>

      {/* Jumlah soal */}
      <div className="mb-4">
        <label className="font-semibold">Jumlah Soal</label>
        <input
          type="number"
          min="1"
          value={jumlahSoal}
          onChange={(e) => setJumlahSoal(Number(e.target.value))}
          className={`border p-2 rounded w-full ${
            errors.jumlahSoal
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300"
          }`}
          placeholder="Contoh: 3"
        />
        {errors.jumlahSoal && (
          <p className="text-red-500 text-sm mt-1">{errors.jumlahSoal}</p>
        )}
        <button
          onClick={handleGenerateSoal}
          className="px-3 py-2 bg-blue-500 text-white rounded w-full md:w-auto mt-4 font-semibold hover:bg-blue-700"
        >
          Generate
        </button>
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
      {soalList.length > 0 && (
        <button
          onClick={handleSimpan}
          disabled={loading}
          className={`px-3 py-2 rounded w-full md:w-auto font-semibold flex items-center justify-center gap-2 ${
            loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-500 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              Menyimpan...
            </>
          ) : (
            "Buat Soal"
          )}
        </button>
      )}

      {/* Popup berhasil */}
      {showPopup && (
        <BuatSoalBerhasil
          onClose={() => {
            setShowPopup(false);
            navigate("/halaman-awal"); // pindah setelah user klik OK
          }}
        />
      )}
      </div>
      <Footer />
    </div>
  );
}
