import React from "react";

export default function HapusAkunPopup({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform animate-scale-up">
        {/* Icon Warning */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">⚠️</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Hapus Akun Permanen?
        </h2>

        {/* Message */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <p className="text-gray-700 text-center leading-relaxed">
            Apakah Anda yakin ingin menghapus akun Anda secara <span className="font-bold text-red-600">permanen</span>?
          </p>
          <p className="text-sm text-red-600 text-center mt-3 font-semibold">
            ⚠️ Tindakan ini tidak dapat dibatalkan!
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Semua data Anda akan dihapus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Quiz yang Anda buat akan hilang</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Anda harus registrasi ulang untuk masuk kembali</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Ya, Hapus Akun
          </button>
        </div>
      </div>
    </div>
  );
}
