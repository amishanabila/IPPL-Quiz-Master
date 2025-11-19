import React from "react";
import { AlertTriangle } from "lucide-react";

export default function HapusSoalTerakhirPopup({ nomorSoal, onConfirm, onCancel }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fadeIn"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-2xl p-6 sm:p-8 w-[90%] sm:w-[400px] md:w-[500px] max-w-full text-center border-2 border-orange-300 animate-scaleIn">
          <div className="flex justify-center mb-4">
            <div className="w-[85px] h-[85px] border-4 border-red-500 rounded-full flex items-center justify-center bg-white shadow-lg animate-bounce" style={{ animationDuration: '1s', animationIterationCount: '2' }}>
              <AlertTriangle size={48} className="text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-3">
            QuizMaster menyatakan
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed text-lg">
            Hapus soal terakhir?
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 font-bold px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Oke
            </button>
            <button
              onClick={onCancel}
              className="flex-1 font-bold px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
