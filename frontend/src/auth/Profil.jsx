import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import EditProfilPopup from "../popup/EditProfilPopup";
import Footer from "../footer/Footer"; // ✅ Tambahkan ini

export default function Profil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser() || {});
  const [profilePhoto, setProfilePhoto] = useState(
    localStorage.getItem("profilePhoto") || "/icon/default-avatar.png"
  );
  const [showEditPopup, setShowEditPopup] = useState(false);

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target.result);
        localStorage.setItem("profilePhoto", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle edit profil from popup
  const handleSaveProfile = (updatedData) => {
    setUser(updatedData);
    authService.getCurrentUser = () => updatedData;
    localStorage.setItem(
      "profilePhoto",
      updatedData.foto || profilePhoto || "/icon/default-avatar.png"
    );
    setProfilePhoto(updatedData.foto || profilePhoto);
    setShowEditPopup(false);
  };

  return (
    <div className="min-h-screen bg-[#fbe497] relative">
      {/* === Header === */}
      <div className="relative bg-[#fbe497] py-6 flex items-center justify-center">
        <button
  onClick={() => navigate("/halaman-awal")} // 🟢 ubah ke route home
  className="absolute top-6 left-6 px-3 py-2 bg-gray-300 rounded hover:bg-gray-500 hover:text-white z-10 font-semibold"
>
  Kembali
</button>


        {/* Judul di tengah */}
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Profil Saya
        </h1>
      </div>

      {/* === Konten Profil === */}
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-6 mb-6">
        {/* Foto Profil */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={profilePhoto}
              alt="Profil"
              className="w-40 h-40 rounded-full object-cover border-4 border-yellow-300 shadow-lg"
            />
          </div>

          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {/* Info Profil */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Nama Lengkap
            </label>
            <div className="w-full px-4 py-3 bg-gray-100 rounded border border-gray-300">
              {user.nama || "Belum diset"}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Email
            </label>
            <div className="w-full px-4 py-3 bg-gray-100 rounded border border-gray-300">
              {user.email || "Belum diset"}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Nomor Telepon
            </label>
            <div className="w-full px-4 py-3 bg-gray-100 rounded border border-gray-300">
              {user.telepon || "-"}
            </div>
          </div>
        </div>

        {/* Tombol Edit Profil */}
        <button
          onClick={() => setShowEditPopup(true)}
          className="w-full px-6 py-3 bg-orange-400 hover:bg-orange-600 hover:text-white text-black font-bold rounded-full transition"
        >
          Edit Profil
        </button>
      </div>

      {/* Popup Edit Profil */}
      {showEditPopup && (
        <EditProfilPopup
          user={user}
          profilePhoto={profilePhoto}
          onClose={() => setShowEditPopup(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* ✅ Footer di bawah */}
      <Footer />
    </div>
  );
}
