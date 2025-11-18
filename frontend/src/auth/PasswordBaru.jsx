import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import PasswordBaruBerhasil from "../popup/PasswordBaruBerhasil";
import { authService } from "../services/authService";

export default function PasswordBaru() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ password: "", confirmPassword: "", token: "" });
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setErrors(prev => ({
        ...prev,
        token: "Token tidak ditemukan. Silakan minta reset password lagi."
      }));
    }
  }, [token]);

  const togglePassword = () => setShowPassword(!showPassword);
  const toggleConfirm = () => setShowConfirm(!showConfirm);

  const validatePassword = (pass) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,12}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ password: "", confirmPassword: "", token: "" });

    if (!token) {
      setErrors(prev => ({
        ...prev,
        token: "Token tidak ditemukan. Silakan minta reset password lagi."
      }));
      return;
    }

    let newErrors = { password: "", confirmPassword: "", token: "" };
    let valid = true;

    if (!password) {
      newErrors.password = "Password baru wajib diisi";
      valid = false;
    } else if (!validatePassword(password)) {
      newErrors.password =
        "Password harus 8–12 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol (!@#$%^&*()_+-=[]{};\\':\"|,.<>/?).";
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok";
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Kirim password baru ke backend dengan token
      const response = await authService.resetPassword(token, password);

      if (response.status === "success") {
        setShowPopup(true);
      } else {
        setErrors({
          password: response.message,
          confirmPassword: response.message,
          token: ""
        });
      }
    } catch (err) {
      setErrors({
        password: err.message || "Terjadi kesalahan",
        confirmPassword: err.message || "Terjadi kesalahan",
        token: ""
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors({ ...errors, password: "" });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    navigate("/login"); // redirect ke halaman login
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 p-4 overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div
        className={`bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white relative z-50 ${
          showPopup || loading ? "pointer-events-none opacity-70" : ""
        }`}
      >
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
          Buat Password Baru
        </h1>
        <p className="text-center text-gray-600 mb-6 text-sm">Masukkan password baru Anda</p>

        {errors.token && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-xl">
            <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
              <span>⚠️</span>
              {errors.token}
            </p>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} disabled={!token || loading}>
          {/* Password Baru */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 font-medium text-gray-700">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Masukkan password baru"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading || !token}
                className={`w-full border-2 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 shadow-md pr-12 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-orange-200"
                }`}
              />
              <button
                type="button"
                onClick={togglePassword}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-orange-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {errors.password}
                </p>
              </div>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="mb-1 font-medium text-gray-700">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                id="confirmPassword"
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={loading || !token}
                className={`w-full border-2 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 shadow-md pr-12 ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-orange-200"
                }`}
              />
              <button
                type="button"
                onClick={toggleConfirm}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-orange-600 transition-colors"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {errors.confirmPassword}
                </p>
              </div>
            )}
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={loading || !token}
            className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-200 w-full flex justify-center items-center hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Simpan Password"
            )}
          </button>
        </form>
      </div>

      {/* Popup */}
      {showPopup && <PasswordBaruBerhasil onClose={handlePopupClose} />}
    </div>
  );
}
