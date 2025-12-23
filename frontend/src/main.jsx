import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Import komponen proteksi
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import FlexibleRoute from "./components/FlexibleRoute.jsx";

// Import halaman
import Role from "./auth/Role.jsx";
import HalamanAwalKreator from "./HalamanAwalKreator.jsx";
import HalamanAwalPeserta from "./HalamanAwalPeserta.jsx";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import LupaPassword from "./auth/LupaPassword.jsx"
import PasswordBaru from "./auth/PasswordBaru.jsx";
import Profil from "./auth/Profil.jsx";
import LoginAdmin from "./auth/LoginAdmin.jsx";
import KumpulanMateri from "./materi/KumpulanMateri.jsx";
import Soal from "./soal/Soal.jsx";
import LihatSoal from "./soal/LihatSoal.jsx";
import BuatSoal from "./buatsoal/BuatSoal.jsx";       
import HasilAkhir from "./hasil akhir/HasilAkhir.jsx";
import Leaderboard from "./leaderboard/Leaderboard.jsx";
import DashboardAdmin from "./admin/DashboardAdmin.jsx";
import KelolaUsers from "./admin/KelolaUsers.jsx"; 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ========== HALAMAN PUBLIK (TANPA PROTEKSI) ========== */}
        {/* Halaman awal - pilih role */}
        <Route path="/" element={<Role />} />
        
        {/* Halaman login & register */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lupa-password" element={<LupaPassword />} />
        <Route path="/password-baru" element={<PasswordBaru />} />

        {/* Halaman Admin - Login khusus admin */}
        <Route path="/admin" element={<LoginAdmin />} />

        {/* ========== HALAMAN PESERTA (TANPA LOGIN - INPUT PIN & NAMA) ========== */}
        {/* Peserta TIDAK PERLU LOGIN, hanya input PIN dan nama */}
        <Route path="/halaman-awal-peserta" element={<HalamanAwalPeserta />} />

        {/* ========== HALAMAN KREATOR (PERLU LOGIN) ========== */}
        <Route 
          path="/halaman-awal-kreator" 
          element={
            <ProtectedRoute requiredRole="kreator">
              <HalamanAwalKreator />
            </ProtectedRoute>
          } 
        />
        
        {/* Daftar Materi */}
        <Route 
          path="/kumpulan-materi" 
          element={
            <ProtectedRoute>
              <KumpulanMateri />
            </ProtectedRoute>
          } 
        />

        {/* Buat soal baru - HANYA KREATOR */}
        <Route 
          path="/buat-soal" 
          element={
            <ProtectedRoute requiredRole="kreator">
              <BuatSoal />
            </ProtectedRoute>
          } 
        />

        {/* ========== HALAMAN FLEXIBLE (PESERTA TANPA LOGIN / USER LOGIN) ========== */}
        
        {/* Halaman Soal Dinamis - Bisa diakses peserta (via PIN) atau user login */}
        <Route 
          path="/soal/:slug" 
          element={
            <FlexibleRoute>
              <Soal />
            </FlexibleRoute>
          } 
        />

        {/* Halaman Hasil Akhir - Bisa diakses peserta atau user login */}
        <Route 
          path="/hasil-akhir" 
          element={
            <FlexibleRoute>
              <HasilAkhir />
            </FlexibleRoute>
          } 
        />

        {/* Halaman Leaderboard - Bisa diakses peserta atau user login */}
        <Route 
          path="/leaderboard" 
          element={
            <FlexibleRoute>
              <Leaderboard />
            </FlexibleRoute>
          } 
        />
        
        {/* ========== HALAMAN KREATOR (HANYA USER LOGIN) ========== */}
        
        {/* Halaman Lihat Soal (view only) - Hanya kreator */}
        <Route 
          path="/lihat-soal/:kategori" 
          element={
            <ProtectedRoute>
              <LihatSoal />
            </ProtectedRoute>
          } 
        />

        {/* Profil - semua user yang login */}
        <Route 
          path="/profil" 
          element={
            <ProtectedRoute>
              <Profil />
            </ProtectedRoute>
          } 
        />

        {/* ========== HALAMAN ADMIN (HANYA ADMIN) ========== */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute requiredRole="admin">
              <KelolaUsers />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
