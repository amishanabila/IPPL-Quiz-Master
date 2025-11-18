import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService';
import { Loader2 } from "lucide-react";
import ResetPasswordBerhasil from "../popup/ResetPasswordBerhasil"; // path sesuai file-mu

export default function LupaPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email) {
      setError("Email wajib diisi");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.requestPasswordReset(email);
      
      if (response.status === 'success') {
        setIsSuccess(true);
      } else {
        setError(response.message || "Terjadi kesalahan. Coba lagi.");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 p-4 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white relative z-10">
        <div className="flex justify-center mb-4 relative">
          <div className="absolute inset-0 bg-orange-300/40 blur-2xl rounded-full"></div>
          <img
            src="/logo.png"
            alt="QuizMaster Logo"
            className="h-[120px] w-[120px] sm:h-[120px] sm:w-[120px] relative animate-bounce"
            style={{ animationDuration: '2s' }}
          />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
          Lupa Password
        </h1>
        <p className="text-center text-gray-600 mb-6 text-sm">Masukkan email Anda untuk reset password</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`border-2 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 shadow-md ${
                error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-orange-200"
              }`}
            />
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] w-full"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Reset Password"}
            </button>
          </div>
        </form>
      </div>

      {isSuccess && <ResetPasswordBerhasil onClose={() => setIsSuccess(false)} />}
    </div>
  );
}
