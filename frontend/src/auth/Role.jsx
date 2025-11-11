import React from "react";
import { useNavigate } from "react-router-dom";

export default function Role() {
  const navigate = useNavigate();

  const handlePeserta = () => {
    navigate("/halaman-awal-peserta"); // halaman awal peserta (PIN + Nama)
  };

  const handlePembuatSoal = () => {
    navigate("/login"); // arahkan ke login pembuat soal
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-yellow-200 p-4">
      <div className="bg-yellow-50 p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="QuizMaster Logo"
            className="h-[150px] w-[150px]"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">
          Selamat Datang di QuizMaster
        </h1>
        <p className="mb-8 text-gray-700">
          Silakan pilih peran Anda untuk masuk ke sistem.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={handlePeserta}
            className="bg-green-400 hover:bg-green-600 text-black font-bold py-2 rounded-full shadow transition duration-200"
          >
            Masuk sebagai Peserta
          </button>

          <button
            onClick={handlePembuatSoal}
            className="bg-orange-400 hover:bg-orange-600 text-black font-bold py-2 rounded-full shadow transition duration-200"
          >
            Masuk sebagai Pembuat Soal
          </button>
        </div>
      </div>
    </div>
  );
}
