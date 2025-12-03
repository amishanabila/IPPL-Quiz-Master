import React, { useEffect } from "react";

export default function HapusAkunBerhasilPopup({ onClose }) {
  useEffect(() => {
    // Auto redirect setelah 3 detik
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform animate-scale-up">
        {/* Icon Success */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
            <span className="text-5xl">✅</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Akun Berhasil Dihapus
        </h2>

        {/* Message */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <p className="text-gray-700 text-center leading-relaxed">
            Akun Anda telah berhasil dihapus dari sistem.
          </p>
          <p className="text-sm text-gray-600 text-center mt-2">
            Terima kasih telah menggunakan platform kami! 👋
          </p>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500 mb-4">
          Anda akan diarahkan ke halaman registrasi...
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full animate-progress"></div>
        </div>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          Lanjutkan ke Registrasi
        </button>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-progress {
          animation: progress 3s linear;
        }

        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-up {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
