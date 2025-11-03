import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[\S]{8,12}$/.test(password);

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
      "Password harus 8–12 karakter, huruf besar & kecil, angka & simbol";

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
      // Loading selama 10 detik
      await new Promise((res) => setTimeout(res, 10000));

      // Jika berhasil, tampilkan popup
      setShowPopup(true);
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
    <div className="flex items-center justify-center min-h-screen bg-yellow-200 p-4">
      <div className="bg-yellow-50 p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md relative">
        <h1 className="text-2xl font-bold text-center mb-6">Buat Akun</h1>

        {/* Error API */}
        {errors.api && (
          <div className="mb-4 text-red-600 text-center font-semibold">{errors.api}</div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-medium">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className={`border rounded-md px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.email ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Nama */}
          <div className="flex flex-col">
            <label htmlFor="nama" className="mb-1 font-medium">Nama Lengkap</label>
            <input
              type="text"
              id="nama"
              name="nama"
              placeholder="Nama Lengkap"
              value={formData.nama}
              onChange={handleInputChange}
              disabled={loading}
              className={`border rounded-md px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.nama ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
              }`}
            />
            {errors.nama && <p className="text-red-500 text-sm mt-1">{errors.nama}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full border rounded-md px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10 ${
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

          {/* Konfirmasi Password */}
          <div className="flex flex-col">
            <label htmlFor="konfirmasi" className="mb-1 font-medium">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                id="konfirmasi"
                name="konfirmasi"
                placeholder="Konfirmasi Password"
                value={formData.konfirmasi}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full border rounded-md px-3 py-2 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10 ${
                  errors.konfirmasi ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={toggleConfirm}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-black"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.konfirmasi && <p className="text-red-500 text-sm mt-1">{errors.konfirmasi}</p>}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-400 hover:bg-orange-700 hover:text-white text-black font-bold py-2 rounded-full shadow transition-colors duration-200 w-full flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Daftar"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-sm text-center text-gray-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-gray-600 underline hover:underline">Masuk</Link>
        </div>
      </div>

      {/* Popup Registrasi */}
      {showPopup && <RegistrasiBerhasil onClose={handlePopupClose} />}
    </div>
  );
}
