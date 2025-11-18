import React from "react";

import { useState, useEffect } from "react";

const LoginBerhasil = ({ onClose }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
            Login Berhasil!
          </h2>
          <p className="text-gray-700 text-sm mb-6">
            Redirect otomatis dalam <span className="font-bold text-orange-600">{countdown}</span> detik...
          </p>
          <button
            onClick={onClose}
            className="font-bold px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full"
          >
            ✓ Oke
          </button>
        </div>
      </div>
    </>
  );
};

export default LoginBerhasil;
