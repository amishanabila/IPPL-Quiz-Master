import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from '../services/authService';
import { Eye, EyeOff, Loader2 } from "lucide-react";
import LoginBerhasil from "../popup/LoginBerhasil";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error
    setErrors({ email: "", password: "" });

    // Validasi sederhana
    let newErrors = { email: "", password: "" };
    let valid = true;

    if (!email) {
      newErrors.email = "Email wajib diisi";
      valid = false;
    }
    if (!password) {
      newErrors.password = "Password wajib diisi";
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      
      if (response.status === 'success') {
        setShowPopup(true);
      } else {
        setErrors({
          email: response.message,
          password: response.message,
        });
      }
    } catch (err) {
      setErrors({
        email: err.message || "Terjadi kesalahan",
        password: err.message || "Terjadi kesalahan",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({ ...errors, email: "" });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors({ ...errors, password: "" });
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    navigate("/halaman-awal"); // redirect setelah klik Oke
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
        <h1 className="text-2xl font-bold text-center mb-6">Masuk ke QuizMaster</h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-medium">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              className={`border rounded px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.email ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                className={`w-full border rounded px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10 ${
                  errors.password ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
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
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-400 hover:bg-orange-700 hover:text-white text-black font-bold py-2 rounded-full shadow transition-colors duration-200 w-full flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Login"}
          </button>
        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between mt-4 text-sm gap-2 sm:gap-0">
          <p className="text-gray-700">
            Belum punya akun? <Link to="/register" className="text-gray-700 underline">Daftar</Link>
          </p>
          <Link to="/lupa-password" className="text-gray-700 hover:underline">Lupa Password?</Link>
        </div>
      </div>

      {/* Popup */}
      {showPopup && <LoginBerhasil onClose={handlePopupClose} />}
    </div>
  );
}
