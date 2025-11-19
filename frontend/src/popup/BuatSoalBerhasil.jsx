import React from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check } from "lucide-react";

export default function BuatSoalBerhasil({ pinCode, onClose, isEdit = false }) {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKembali = () => {
    navigate("/halaman-awal-kreator");
    if (onClose) onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fadeIn"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-2xl p-6 sm:p-8 w-[90%] sm:w-[400px] md:w-[500px] max-w-full text-center border-2 border-orange-300 animate-scaleIn">
          <div className="flex justify-center mb-4">
            <div className="w-[85px] h-[85px] border-4 border-green-500 rounded-full flex items-center justify-center bg-white shadow-lg animate-bounce" style={{ animationDuration: '1s', animationIterationCount: '2' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-3">
            {isEdit ? "Soal Berhasil Diperbarui!" : "Soal Berhasil Dibuat!"}
          </h2>
          <p className="text-gray-700 text-sm mb-4">
            {isEdit ? "Quiz Anda telah berhasil diperbarui" : "Quiz Anda telah berhasil dibuat dan siap digunakan"}
          </p>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border-2 border-green-300">
            <p className="text-sm text-gray-700 font-semibold mb-3">🔑 PIN Quiz Anda:</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-white px-6 py-3 rounded-xl border-2 border-green-500 shadow-lg">
                <span className="text-3xl font-mono font-bold text-green-600 tracking-widest">
                  {pinCode}
                </span>
              </div>
              <button
                onClick={handleCopyPin}
                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all transform hover:scale-110 shadow-lg"
                title="Copy PIN"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 font-semibold animate-pulse">
                ✓ PIN berhasil disalin!
              </p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              📱 Bagikan PIN ini kepada peserta untuk mengikuti quiz
            </p>
          </div>
          
          <button
            onClick={handleKembali}
            className="font-bold px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    </>
  );
}
