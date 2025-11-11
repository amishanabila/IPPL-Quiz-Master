import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Import halaman
import Role from "./auth/Role.jsx";
import HalamanAwal from "./HalamanAwal.jsx";
import HalamanAwalPeserta from "./HalamanAwalPeserta.jsx";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import LupaPassword from "./auth/LupaPassword.jsx"
import PasswordBaru from "./auth/PasswordBaru.jsx";
import Profil from "./auth/Profil.jsx";
import KumpulanMateri from "./materi/KumpulanMateri.jsx";
import Soal from "./soal/Soal.jsx";
import BuatSoal from "./buat soal/BuatSoal.jsx";       
import HasilAkhir from "./hasil akhir/HasilAkhir.jsx"; 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Halaman awal - pilih role */}
        <Route path="/" element={<Role />} />
        
        {/* Halaman peserta */}
        <Route path="/halaman-awal-peserta" element={<HalamanAwalPeserta />} />
        <Route path="/halaman-awal" element={<HalamanAwal />} />
        
        {/* Daftar Materi */}
        <Route path="/kumpulan-materi" element={<KumpulanMateri />} />

        {/* Buat soal baru */}
        <Route path="/buat-soal" element={<BuatSoal />} />

        {/* Halaman Soal Dinamis */}
        <Route path="/soal/:slug" element={<Soal />} />

        {/* Halaman Hasil Akhir */}
        <Route path="/hasil-akhir" element={<HasilAkhir />} />

        {/* Halaman login & register */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lupa-password" element={<LupaPassword />} />
        <Route path="/password-baru" element={<PasswordBaru />} />
        <Route path="/profil" element={<Profil />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
