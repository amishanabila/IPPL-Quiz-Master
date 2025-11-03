import React from 'react';

const KonfirmasiLogout = ({ onConfirm, onCancel }) => {
  const pesan = {
    title: 'Yakin ingin Logout?',
    message: '',
  };

  return (
    <>
      {/* Overlay blur di belakang popup */}
      <div className="fixed inset-0 bg-orange-500/50 backdrop-blur z-50"></div>

      {/* Popup */}
      <div className="fixed inset-0 flex items-center justify-center z-50 px-2">
        <div className="bg-orange-400 rounded shadow p-4 sm:p-6 w-[90%] sm:w-[400px] md:w-[500px] max-w-full text-center">
          <svg
            className="mx-auto mb-2"
            xmlns="http://www.w3.org/2000/svg"
            width="75"
            height="75"
            fill="none"
            viewBox="0 0 24 24"
            stroke="green"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856C19.403 19 20 18.403 20 17.656V6.344C20 5.597 19.403 5 18.656 5H5.344C4.597 5 4 5.597 4 6.344v11.312C4 18.403 4.597 19 5.344 19z"
            />
          </svg>
          <p className="font-bold text-lg text-white">{pesan.title}</p>
          {pesan.message && (
            <p className="text-white mt-1 text-md leading-5">{pesan.message}</p>
          )}
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <button
              className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 font-semibold"
              onClick={onCancel}
            >
              Tidak
            </button>
            <button
              className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 font-semibold"
              onClick={onConfirm}
            >
              Ya
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default KonfirmasiLogout;
