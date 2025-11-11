import React, { useState } from "react";
import { Upload, X } from "lucide-react";

export default function EditProfilPopup({ user, profilePhoto, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nama: user.nama || "",
    email: user.email || "",
    telepon: user.telepon || "",
  });
  const [photo, setPhoto] = useState(profilePhoto);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nama.trim()) {
      newErrors.nama = "Nama wajib diisi";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\s]+$/.test(formData.nama)) {
      newErrors.nama =
        "Nama harus ada huruf besar & kecil, dan hanya huruf/spasi";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(formData.email)) {
      newErrors.email = "Email harus @gmail.com dan huruf kecil";
    }

    if (formData.telepon && !/^\d{10,12}$/.test(formData.telepon)) {
      newErrors.telepon = "Nomor telepon harus 10-12 digit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const fd = new FormData();
      fd.append("nama", formData.nama);
      fd.append("email", formData.email);
      fd.append("telepon", formData.telepon || "");
      if (selectedFile) fd.append("photo", selectedFile);

      const { authService } = await import("../services/authService");
      const res = await authService.updateProfile(fd);

      if (res.status === "success" && res.data && res.data.user) {
        const updatedUser = { ...res.data.user, foto: photo };
        localStorage.setItem("profilePhoto", photo);
        window.dispatchEvent(new CustomEvent("profileUpdated", { detail: updatedUser }));
        onSave(updatedUser);
      } else {
        const merged = { ...user, ...formData, foto: photo };
        localStorage.setItem("profilePhoto", photo);
        window.dispatchEvent(new CustomEvent("profileUpdated", { detail: merged }));
        onSave(merged);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">Edit Profil</h2>

        <div className="text-center mb-6">
          <img
            src={photo}
            alt="Profil"
            className="w-32 h-32 rounded-full object-cover border-4 border-yellow-300 mx-auto mb-3"
          />
          <label
            htmlFor="photo-upload"
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full cursor-pointer transition"
          >
            <Upload size={16} />
            Ubah Foto
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                errors.nama ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.nama && (
              <p className="text-red-500 text-xs mt-1">{errors.nama}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                errors.email ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Nomor Telepon
            </label>
            <input
              type="tel"
              name="telepon"
              value={formData.telepon}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                errors.telepon ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.telepon && (
              <p className="text-red-500 text-xs mt-1">{errors.telepon}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-500 text-black font-bold rounded-full transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
