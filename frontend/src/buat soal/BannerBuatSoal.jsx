import React from "react";
import { useNavigate } from "react-router-dom";

export default function BannerBuatSoal() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center items-center py-5 px-4">
      <div className="w-full bg-[#0e4c49] text-white rounded p-8 md:p-12 flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Illustration */}
        <div className="flex-shrink-0 flex justify-center">
          <img
            src="/kuis.png"
            alt="Create quiz illustration"
            className="w-40 h-40 object-contain"
          />
        </div>

        {/* Text and Button */}
        <div className="flex flex-col gap-4 text-center md:text-left items-center md:items-start">
          <h2 className="text-2xl md:text-3xl font-bold">Buat Kuis Sendiri</h2>
          <p className="text-base md:text-lg">
            Biar rasain <br /> bagaimana rasanya kuis
          </p>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow-md transition duration-200"
            onClick={() => navigate("/buat-soal")}
          >
            Buat Soal
          </button>
        </div>
      </div>
    </div>
  );
}
