import React from "react";

const ResetPasswordBerhasil = ({ onClose }) => {
  const handleOpenGmail = () => {
    // Buka Gmail di tab baru
    window.open("https://mail.google.com", "_blank");
  };

  return (
    <>
      <div className="fixed inset-0 bg-orange-500/50 backdrop-blur z-50"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div className="bg-orange-400 rounded shadow p-6 sm:p-8 w-full sm:w-[400px] md:w-[500px] max-w-full text-center">
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
          <h2 className="text-xl font-bold text-white mb-2">Email Berhasil Dikirim!</h2>
          <p className="text-white text-sm mb-6">
            Link reset password telah dikirim ke email Anda. Silakan cek email dan klik link untuk membuat password baru.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleOpenGmail}
              className="font-semibold px-5 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition w-full"
            >
              Buka Gmail
            </button>
            <button
              onClick={onClose}
              className="font-semibold px-5 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition w-full"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordBerhasil;
