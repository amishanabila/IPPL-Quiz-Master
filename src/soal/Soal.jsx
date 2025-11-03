import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DataMateri from "../materi/DataMateri";

// Import soal map
import { soalMap } from "../soal";

export default function Soal() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const fromSlug = (text) =>
    text.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const materiSlug = fromSlug(slug);

  const semuaMateriDefault = DataMateri.Semua;
  const materiDefault = semuaMateriDefault.find((m) => m.materi === materiSlug);

  const materiUser = JSON.parse(localStorage.getItem("materi")) || [];
  const materiCustom = materiUser.find((m) => m.materi === materiSlug);

  const materi = materiCustom || materiDefault;

  // --- Ambil soal sesuai kategori ---
  const getSoalByKategori = (materi, slug) => {
    const soalUser = JSON.parse(localStorage.getItem("soal")) || {};
    if (materiCustom && soalUser[slug]) return [...soalUser[slug]];

    const dataSoal = soalMap[materi?.kategori];
    return dataSoal && dataSoal[slug] ? [...dataSoal[slug]] : [];
  };

  // --- Ambil soal dan acak sekali saat init ---
  const [soalListRandom] = useState(() => {
    const list = getSoalByKategori(materi, materiSlug);
    return list.sort(() => Math.random() - 0.5);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawabanUser, setJawabanUser] = useState({});
  const soalAktif = soalListRandom[currentIndex];

  // --- TIMER GLOBAL 60 DETIK ---
  const TOTAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  useEffect(() => {
    if (soalListRandom.length === 0) return;

    if (timeLeft <= 0) {
      localStorage.setItem(
        "hasilQuiz",
        JSON.stringify({
          materi: materiSlug,
          kategori: materi?.kategori,
          soalList: soalListRandom,
          jawabanUser,
        })
      );
      navigate("/hasil-akhir");
      return;
    }

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate, jawabanUser, materiSlug, materi, soalListRandom]);

  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (timeLeft / TOTAL_TIME) * circumference;

  const pilihJawaban = (opsi) => {
    const newJawaban = { ...jawabanUser, [soalAktif.id]: opsi };
    setJawabanUser(newJawaban);

    const jawabanSemua = JSON.parse(localStorage.getItem("jawabanUser")) || {};
    jawabanSemua[materiSlug] = newJawaban;
    localStorage.setItem("jawabanUser", JSON.stringify(jawabanSemua));
  };

  const handleNext = () => {
    if (currentIndex < soalListRandom.length - 1)
      setCurrentIndex((prev) => prev + 1);
    else {
      localStorage.setItem(
        "hasilQuiz",
        JSON.stringify({
          materi: materiSlug,
          kategori: materi?.kategori,
          soalList: soalListRandom,
          jawabanUser,
        })
      );
      navigate("/hasil-akhir");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div className="relative min-h-screen p-6 flex flex-col">
      {/* Tombol Kembali */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 px-3 py-2 bg-gray-300 rounded hover:bg-gray-500 hover:text-white z-10 font-semibold"
      >
        Kembali
      </button>

      {/* Timer */}
      {soalListRandom.length > 0 && (
        <div className="absolute top-6 right-6 z-10">
          <svg height={radius * 2} width={radius * 2}>
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={timeLeft <= 10 ? "#ef4444" : "#3b82f6"}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{
                strokeDashoffset,
                transition: "stroke-dashoffset 1s linear",
              }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              className="text-lg font-bold fill-current text-black"
            >
              {timeLeft}s
            </text>
          </svg>
        </div>
      )}

      {/* Judul */}
      {materi && soalListRandom.length > 0 && (
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{materi.materi}</h1>
          <p className="text-gray-700 mt-1 font-semibold">{materi.kategori}</p>
        </div>
      )}

      {/* Soal atau pesan */}
      <div className="flex-grow flex items-center justify-center">
        {soalAktif ? (
          <div className="border border-gray-300 rounded-lg p-6 shadow-sm bg-white w-full max-w-3xl">
            <p className="font-semibold mb-4">
              {currentIndex + 1}. {soalAktif.soal}
            </p>

            {soalAktif.opsi?.length > 0 ? (
              <ul className="space-y-2 mb-6">
                {soalAktif.opsi.map((opsi, index) => {
                  const huruf = String.fromCharCode(65 + index);
                  return (
                    <li
                      key={index}
                      onClick={() => pilihJawaban(opsi)}
                      className={`border rounded-md px-3 py-2 cursor-pointer ${
                        jawabanUser[soalAktif.id] === opsi
                          ? "bg-blue-200 border-blue-500"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-semibold mr-2">{huruf}.</span>{" "}
                      {opsi}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <textarea
                className="w-full border rounded p-2 mb-6"
                placeholder="Ketik jawaban Anda di sini..."
                value={jawabanUser[soalAktif.id] || ""}
                onChange={(e) =>
                  setJawabanUser({
                    ...jawabanUser,
                    [soalAktif.id]: e.target.value,
                  })
                }
              />
            )}

            <div className="flex justify-between">
              {currentIndex > 0 ? (
                <button
                  onClick={handlePrev}
                  className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-500"
                >
                  Kembali
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleNext}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                {currentIndex === soalListRandom.length - 1
                  ? "Selesai"
                  : "Selanjutnya"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-xl">
            Soal untuk materi ini belum tersedia.
          </p>
        )}
      </div>
    </div>
  );
}
