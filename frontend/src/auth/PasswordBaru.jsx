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
    <div className="relative flex items-center justify-center min-h-screen bg-yellow-200 p-4">
      <div
        className={`bg-yellow-50 p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md z-50 ${
          showPopup || loading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="QuizMaster Logo"
            className="h-[150px] w-[150px] sm:h-[150px] sm:w-[150px]"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Buat Password Baru</h1>

        {errors.token && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            {errors.token}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} disabled={!token || loading}>
          {/* Password Baru */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 font-medium">
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
                className={`w-full border rounded px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={togglePassword}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-black"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="mb-1 font-medium">
              Konfirmasi Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Konfirmasi password baru"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={loading || !token}
              className={`border rounded px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={loading || !token}
            className="bg-orange-400 hover:bg-orange-700 hover:text-white text-black font-bold py-2 rounded-full shadow transition-colors duration-200 w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
