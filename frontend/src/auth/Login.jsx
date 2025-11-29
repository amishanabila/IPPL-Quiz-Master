import React, { useState, useEffect } from "react";
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

  // Check if already logged in - HANYA check, tidak auto redirect
  // Biarkan ProtectedRoute yang handle redirect
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const userRole = authService.getUserRole();
      const userData = authService.getCurrentUser();
      const actualRole = userRole || userData?.role;
      
      console.log("ℹ️ Login.jsx - User sudah login dengan role:", actualRole);
      // Tidak auto redirect, biarkan user klik login atau akses langsung halaman lain
      // ProtectedRoute akan handle redirect yang benar
    }
  }, []);

  // Cleanup timer saat component unmount
  useEffect(() => {
    return () => {
      if (window.autoRedirectTimer) {
        clearTimeout(window.autoRedirectTimer);
      }
    };
  }, []);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({ ...errors, email: "" });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors({ ...errors, password: "" });
  };

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
      
      console.log("📥 Response dari login:", response);
      console.log("📥 Response status:", response?.status);
      console.log("📥 Response success:", response?.success);
      
      if (response.status === 'success' || response.success) {
        console.log("✅ Login berhasil, menampilkan popup");
        
        // Tentukan destination berdasarkan role
        const userRole = response.data?.user?.role;
        const storedRole = localStorage.getItem('userRole');
        
        console.log("👤 User role dari response:", userRole);
        console.log("👤 User role dari localStorage:", storedRole);
        console.log("📦 Full user data:", response.data?.user);
        
        let destination;
        
        if (userRole === 'admin') {
          destination = '/admin/dashboard';
          console.log("👑 Admin login, redirect ke /admin/dashboard");
        } else if (userRole === 'kreator') {
          destination = '/halaman-awal-kreator';
          console.log("✏️ Kreator login, redirect ke /halaman-awal-kreator");
        } else {
          // Fallback: jika role tidak jelas, default ke kreator
          destination = '/halaman-awal-kreator';
          console.log("⚠️ Role tidak jelas, default ke /halaman-awal-kreator");
        }
        
        console.log("🎯 Final destination:", destination);
        
        setShowPopup(true);
        
        // Auto redirect setelah 3 detik (sesuai countdown di popup)
        const autoRedirectTimer = setTimeout(() => {
          console.log("⏰ Auto redirect ke", destination);
          navigate(destination, { replace: true });
        }, 3000);
        
        // Store timer untuk dibersihkan saat user klik manual
        window.autoRedirectTimer = autoRedirectTimer;
        window.loginDestination = destination;
      } else {
        console.error("❌ Login gagal:", response);
        const errorMsg = response.message || response.error || "Email atau password salah";
        setErrors({
          email: errorMsg,
          password: errorMsg,
        });
      }
    } catch (err) {
      console.error("❌ Error saat login:", err);
      setErrors({
        email: err.message || "Terjadi kesalahan saat login",
        password: err.message || "Terjadi kesalahan saat login",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    console.log("🔘 User klik Oke di popup");
    
    // Clear auto redirect timer
    if (window.autoRedirectTimer) {
      clearTimeout(window.autoRedirectTimer);
    }
    
    setShowPopup(false);
    
    // Get destination from stored value
    let destination = window.loginDestination;
    
    // If no stored destination, determine from current localStorage
    if (!destination) {
      const userRole = localStorage.getItem('userRole');
      destination = userRole === 'admin' ? '/admin/dashboard' : '/halaman-awal-kreator';
      console.log("⚠️ No stored destination, determined from role:", userRole, "→", destination);
    }
    
    // Redirect immediately
    console.log("➡️ Manual redirect ke", destination);
    navigate(destination, { replace: true });
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
        className={`relative bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg border-4 border-white/50 z-50 ${
          showPopup || loading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full blur-lg opacity-50"></div>
            <img
              src="/logo.png"
              alt="QuizMaster Logo"
              className="relative h-[150px] w-[150px] drop-shadow-2xl"
            />
          </div>
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 text-center mb-6">Masuk ke QuizMaster</h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2 font-bold text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              placeholder="email@gmail.com"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              className={`border-2 rounded-xl px-4 py-3 bg-gradient-to-br from-yellow-50 to-orange-50 focus:outline-none focus:ring-4 transition-all shadow-md ${
                errors.email ? "border-red-500 focus:ring-red-300" : "border-orange-300 focus:ring-orange-200 focus:border-orange-500"
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
            <label htmlFor="password" className="mb-2 font-bold text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                className={`w-full border-2 rounded-xl px-4 py-3 bg-gradient-to-br from-yellow-50 to-orange-50 focus:outline-none focus:ring-4 pr-12 transition-all shadow-md ${
                  errors.password ? "border-red-500 focus:ring-red-300" : "border-orange-300 focus:ring-orange-200 focus:border-orange-500"
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
            className="group relative bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-105 hover:shadow-2xl w-full flex justify-center items-center text-lg overflow-hidden mt-2"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <span className="relative">{loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Login"}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between mt-6 text-sm gap-2 sm:gap-0">
          <p className="text-gray-700 font-medium">
            Belum punya akun? <Link to="/register" className="text-orange-600 font-bold hover:underline">Daftar</Link>
          </p>
          <Link to="/lupa-password" className="text-orange-600 font-bold hover:underline">Lupa Password?</Link>
        </div>
      </div>

      {/* Popup */}
      {showPopup && <LoginBerhasil onClose={handlePopupClose} />}
    </div>
  );
}
