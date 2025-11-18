import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from '../services/authService';
import { Eye, EyeOff, Loader2 } from "lucide-react";
import RegistrasiBerhasil from "../popup/RegistrasiBerhasil";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    nama: "",
    password: "",
    konfirmasi: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Validasi
  const validateEmail = (email) => /^[a-z0-9._%+-]+@gmail\.com$/.test(email);
  const validateName = (name) => /^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\s]+$/.test(name);
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,12}$/.test(password);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Validasi form
  const validateForm = () => {
    const { email, nama, password, konfirmasi } = formData;
    const newErrors = {};

    if (!email) newErrors.email = "Email wajib diisi";
    else if (!validateEmail(email)) newErrors.email = "Email harus @gmail.com dan huruf kecil";

    if (!nama) newErrors.nama = "Nama wajib diisi";
    else if (!validateName(nama)) newErrors.nama = "Nama harus ada huruf besar & kecil, dan hanya huruf/spasi";

    if (!password) newErrors.password = "Password wajib diisi";
    else if (!validatePassword(password)) newErrors.password =
      "Password harus 8–12 karakter, huruf besar & kecil, angka & simbol (!@#$%^&*()_+-=[]{};\\':\"|,.<>/?)";

    if (!konfirmasi) newErrors.konfirmasi = "Konfirmasi Password wajib diisi";
    else if (password !== konfirmasi) newErrors.konfirmasi = "Konfirmasi Password tidak sesuai";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authService.register({
        nama: formData.nama,
        email: formData.email,
        password: formData.password
      });
      
      if (response.status === 'success') {
        setShowPopup(true);
      } else {
        throw new Error(response.message || "Terjadi kesalahan. Coba lagi.");
      }
    } catch (err) {
      setErrors({ api: err.message || "Terjadi kesalahan. Coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => setShowPassword(!showPassword);
  const toggleConfirm = () => setShowConfirm(!showConfirm);

  // Tutup popup → langsung ke login
  const handlePopupClose = () => {
    setShowPopup(false);
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-200 to-orange-200 p-4 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-green-300 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg border-4 border-white/50 z-10">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 text-center mb-6">Buat Akun</h1>

        {/* Error API */}
        {errors.api && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
            <span className="text-red-500 text-xl">⚠️</span>
            <p className="text-red-600 font-semibold flex-1">{errors.api}</p>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className={`border-2 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 shadow-md ${
                errors.email ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-orange-200"
              }`}
            />
            {errors.email && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {errors.email}
                </p>
              </div>
            )}
          </div>

          {/* Nama */}
          <div className="flex flex-col">
            <label htmlFor="nama" className="mb-1 font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              id="nama"
              name="nama"
              placeholder="Nama Lengkap"
              value={formData.nama}
              onChange={handleInputChange}
              disabled={loading}
              className={`border-2 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 shadow-md ${
                errors.nama ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-orange-200"
              }`}
            />
            {errors.nama && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {errors.nama}
                </p>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full border-2 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 shadow-md pr-12 ${
                  errors.password ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-orange-200"
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
            <label htmlFor="konfirmasi" className="mb-1 font-medium text-gray-700">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                id="konfirmasi"
                name="konfirmasi"
                placeholder="Konfirmasi Password"
                value={formData.konfirmasi}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full border-2 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 shadow-md pr-12 ${
                  errors.konfirmasi ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-orange-200"
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
            {errors.konfirmasi && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {errors.konfirmasi}
                </p>
              </div>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-200 w-full flex justify-center items-center hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Daftar"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-sm text-center text-gray-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-orange-600 font-bold hover:text-orange-700 transition-colors">Masuk</Link>
        </div>
      </div>

      {/* Popup Registrasi */}
      {showPopup && <RegistrasiBerhasil onClose={handlePopupClose} />}
    </div>
  );
}
