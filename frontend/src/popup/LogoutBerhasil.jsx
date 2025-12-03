import React from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';

const LogoutBerhasil = ({ isAdmin = false }) => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    // Redirect ke halaman login admin jika user adalah admin
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else {
      // Redirect ke dashboard utama untuk user biasa (kreator/peserta)
      navigate('/', { replace: true });
    }
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 1
        }}
      ></div>

      {/* Popup */}
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '28rem',
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-2xl p-6 sm:p-8 text-center border-2 border-green-300">
          {/* Icon Success */}
          <div className="flex justify-center mb-4">
            <div className="w-[85px] h-[85px] border-4 border-green-500 rounded-full flex items-center justify-center bg-white shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#10b981"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Logout Berhasil!
          </h2>

          {/* Message */}
          <p className="text-gray-700 mt-2 mb-6 leading-relaxed">
            Anda telah keluar dari sistem.<br />
            Terima kasih telah menggunakan QuizMaster!
          </p>

          {/* Button Kembali */}
          <button
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl text-base hover:from-blue-600 hover:to-blue-700 font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleBackToDashboard}
          >
            {isAdmin ? '🔐 Kembali ke Login Admin' : '🏠 Kembali ke Dashboard Utama'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default LogoutBerhasil;
