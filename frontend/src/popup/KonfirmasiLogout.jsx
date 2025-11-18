import React from 'react';
import ReactDOM from 'react-dom';

const KonfirmasiLogout = ({ onConfirm, onCancel }) => {
  const pesan = {
    title: 'Yakin ingin Logout?',
    message: '',
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
      {/* Overlay blur di belakang popup */}
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
        onClick={onCancel}
      ></div>

      {/* Popup - Centered with flexbox */}
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '28rem',
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-2xl p-6 sm:p-8 text-center border-2 border-orange-300">
          <div className="flex justify-center mb-4">
            <div className="w-[85px] h-[85px] border-4 border-orange-500 rounded-full flex items-center justify-center bg-white shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#f97316"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856C19.403 19 20 18.403 20 17.656V6.344C20 5.597 19.403 5 18.656 5H5.344C4.597 5 4 5.597 4 6.344v11.312C4 18.403 4.597 19 5.344 19z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
            {pesan.title}
          </h2>
          {pesan.message && (
            <p className="text-gray-700 mt-2 mb-6 leading-relaxed">{pesan.message}</p>
          )}
          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            <button
              className="flex-1 min-w-[120px] bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-3 rounded-xl text-sm hover:from-red-600 hover:to-red-700 font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={onCancel}
            >
              ❌ Tidak
            </button>
            <button
              className="flex-1 min-w-[120px] bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3 rounded-xl text-sm hover:from-green-600 hover:to-green-700 font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={onConfirm}
            >
              ✓ Ya
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render menggunakan Portal ke document.body
  return ReactDOM.createPortal(modalContent, document.body);
};

export default KonfirmasiLogout;
