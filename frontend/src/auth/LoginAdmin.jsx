import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService';
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import LoginBerhasil from "../popup/LoginBerhasil";

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const userRole = authService.getUserRole();
      if (userRole === 'admin') {
        console.log("ℹ️ Admin sudah login, redirect ke dashboard");
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  // Cleanup timer saat component unmount
  useEffect(() => {
    return () => {
      if (window.autoRedirectTimer) {
        clearTimeout(window.autoRedirectTimer);
      }
    };
  }, []);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error
    setErrors({ email: "", password: "" });

    // Validasi sederhana
    let newErrors = { email: "", password: "" };
    let valid = true;

    if (!email) {
      newErrors.email = "Email admin wajib diisi";
      valid = false;
    }
    if (!password) {
      newErrors.password = "Password admin wajib diisi";
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      
      console.log("📥 Response dari login admin:", response);
      console.log("🔍 User role:", response.data?.user?.role);
      console.log("🔍 Full user data:", response.data?.user);
      
      if (response.status === 'success' || response.success) {
        const userRole = response.data?.user?.role;
        
        // Validasi harus admin
        if (userRole !== 'admin') {
          console.error("❌ Bukan admin, akses ditolak. Role:", userRole);
          setErrors({
            email: "Akses ditolak. Halaman ini hanya untuk admin.",
            password: "Akses ditolak. Halaman ini hanya untuk admin.",
          });
          
          // Logout user non-admin
          authService.logout();
          setLoading(false);
          return;
        }
        
        console.log("✅ Login admin berhasil, menampilkan popup");
        
        setShowPopup(true);
        
        // Auto redirect setelah 3 detik
        const autoRedirectTimer = setTimeout(() => {
          console.log("⏰ Auto redirect ke dashboard admin");
          navigate('/admin/dashboard', { replace: true });
        }, 3000);
        
        // Store timer untuk dibersihkan saat user klik manual
        window.autoRedirectTimer = autoRedirectTimer;
        window.loginDestination = '/admin/dashboard';
      } else {
        console.error("❌ Login admin gagal:", response);
        const errorMsg = response.message || response.error || "Email atau password salah";
        setErrors({
          email: errorMsg,
          password: errorMsg,
        });
      }
    } catch (err) {
      console.error("❌ Error saat login admin:", err);
      setErrors({
        email: err.message || "Terjadi kesalahan saat login",
        password: err.message || "Terjadi kesalahan saat login",
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
    console.log("🔘 Admin klik Oke di popup");
    
    // Clear auto redirect timer
    if (window.autoRedirectTimer) {
      clearTimeout(window.autoRedirectTimer);
    }
    
    setShowPopup(false);
    
    // Redirect immediately
    console.log("➡️ Redirect ke dashboard admin");
    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 p-4 overflow-hidden">
      {/* Animated Background Circles - tema admin biru/ungu */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-indigo-400 rounded-full opacity-15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div
        className={`relative bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg border-4 border-white/50 z-50 ${
          showPopup || loading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        {/* Admin Badge */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg">
            <Shield className="h-5 w-5 text-white" />
            <span className="text-white font-bold text-sm">ADMIN ACCESS</span>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-lg opacity-50"></div>
            <img
              src="/logo.png"
              alt="QuizMaster Logo"
              className="relative h-[130px] w-[130px] drop-shadow-2xl"
            />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 text-center mb-2">
          Admin Portal
        </h1>
        <p className="text-gray-600 text-center mb-6 text-sm">Dashboard Administrator QuizMaster</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2 font-bold text-gray-700">Email Admin</label>
            <input
              type="email"
              id="email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              className={`border-2 rounded-xl px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 focus:outline-none focus:ring-4 transition-all shadow-md ${
                errors.email ? "border-red-500 focus:ring-red-300" : "border-blue-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
            />
            {errors.email && (
              <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-red-600 text-sm font-semibold flex-1">{errors.email}</p>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-2 font-bold text-gray-700">Password Admin</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                className={`w-full border-2 rounded-xl px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 focus:outline-none focus:ring-4 pr-12 transition-all shadow-md ${
                  errors.password ? "border-red-500 focus:ring-red-300" : "border-blue-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={togglePassword}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-red-600 text-sm font-semibold flex-1">{errors.password}</p>
              </div>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-105 hover:shadow-2xl w-full flex justify-center items-center text-lg overflow-hidden mt-2"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <span className="relative flex items-center gap-2">
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Login Admin
                </>
              )}
            </span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-blue-700 text-xs text-center font-medium">
            🔒 Portal ini hanya untuk administrator sistem. Semua aktivitas login akan dicatat.
          </p>
        </div>

        {/* Back to Main Login */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 text-sm font-semibold hover:underline"
          >
            ← Kembali ke Login Biasa
          </button>
        </div>
      </div>

      {/* Popup */}
      {showPopup && <LoginBerhasil onClose={handlePopupClose} />}
    </div>
  );
}
