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
    <div className="flex items-center justify-center min-h-screen bg-yellow-200 p-4">
      <div className="bg-yellow-50 p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="QuizMaster Logo"
            className="h-[150px] w-[150px] sm:h-[150px] sm:w-[150px]"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Lupa Password</h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-medium">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-md px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-full shadow transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Reset Password"}
            </button>
          </div>
        </form>
      </div>

      {isSuccess && <ResetPasswordBerhasil onClose={() => navigate("/login")} />}
    </div>
  );
}
