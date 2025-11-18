import React from "react";
import { X, AlertTriangle } from "lucide-react";

export default function HapusSoalPopup({ materi, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Soal?</h3>
          <p className="text-gray-600">
            Yakin ingin menghapus soal <span className="font-semibold">"{materi}"</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded-lg transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
