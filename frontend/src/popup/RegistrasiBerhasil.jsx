import React from "react";

const RegistrasiBerhasil = ({ onClose }) => {
  return (
    <>
      <div className="fixed inset-0 bg-orange-500/50 backdrop-blur z-50"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-orange-400 rounded shadow p-4 sm:p-6 w-[90%] sm:w-[400px] md:w-[500px] max-w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-[75px] h-[75px] border-4 border-green-500 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registrasi Berhasil!</h2>
          <p className="text-white mb-4">Silahkan cek email anda.</p>
          <button
            onClick={onClose}
            className="font-semibold px-5 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 transition"
          >
            Oke
          </button>
        </div>
      </div>
    </>
  );
};

export default RegistrasiBerhasil;
