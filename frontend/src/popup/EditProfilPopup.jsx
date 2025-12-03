import React, { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { authService } from "../services/authService";

export default function EditProfilPopup({ user, profilePhoto, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nama: user.nama || "",
    email: user.email || "",
    telepon: user.telepon || "",
  });
  const [photo, setPhoto] = useState(profilePhoto);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const nameChanged = formData.nama !== (user.nama || "");
    const emailChanged = formData.email !== (user.email || "");
    const teleponChanged = formData.telepon !== (user.telepon || "");
    const photoChanged = selectedFile !== null;

    setHasChanges(nameChanged || emailChanged || teleponChanged || photoChanged);
  }, [formData, selectedFile, user]);

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
      // Validasi file
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, photo: 'File harus berupa gambar' });
        return;
      }
      
      // Validasi ukuran (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, photo: 'Ukuran file maksimal 5MB' });
        return;
      }

      console.log("File selected:", file.name, file.type, file.size);
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log("File preview loaded");
        setPhoto(event.target.result);
      };
      reader.onerror = (error) => {
        console.error("File read error:", error);
        setErrors({ ...errors, photo: 'Gagal membaca file' });
      };
      reader.readAsDataURL(file);
      
      // Clear photo error if exists
      if (errors.photo) {
        const newErrors = { ...errors };
        delete newErrors.photo;
        setErrors(newErrors);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nama: wajib diisi dan harus valid
    if (!formData.nama.trim()) {
      newErrors.nama = "Nama wajib diisi";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\s]+$/.test(formData.nama)) {
      newErrors.nama =
        "Nama harus ada huruf besar & kecil, dan hanya huruf/spasi";
    }

    // Email: wajib diisi dan harus valid
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(formData.email)) {
      newErrors.email = "Email harus @gmail.com dan huruf kecil";
    }

    // Telepon: opsional, tapi kalau diisi harus valid
    if (formData.telepon && formData.telepon.trim() && !/^\d{10,12}$/.test(formData.telepon)) {
      newErrors.telepon = "Nomor telepon harus 10-12 digit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setErrors({});
      setShowUnsavedDialog(false);
      
      const fd = new FormData();
      fd.append("nama", formData.nama);
      fd.append("email", formData.email);
      fd.append("telepon", formData.telepon || "");
      if (selectedFile) {
        console.log("Appending photo to FormData:", selectedFile.name, selectedFile.type, selectedFile.size);
        fd.append("photo", selectedFile, selectedFile.name);
      }

      console.log("Updating profile with data:", {
        nama: formData.nama,
        email: formData.email,
        telepon: formData.telepon,
        hasPhoto: !!selectedFile,
        photoName: selectedFile ? selectedFile.name : null
      });

      const res = await authService.updateProfile(fd);
      console.log("Update profile response:", res);

      if (res && res.status === "success" && res.data && res.data.user) {
        const updatedUser = res.data.user;
        console.log("Profile updated successfully:", updatedUser);
        // Dispatch event to update all components
        window.dispatchEvent(new CustomEvent("profileUpdated", { detail: updatedUser }));
        onSave(updatedUser);
      } else {
        throw new Error(res?.message || "Gagal menyimpan profil");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setErrors({ submit: err.message || "Gagal menyimpan profil. Silakan coba lagi." });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges && !saving) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
    onClose();
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative transform animate-scale-up">
          <button
            onClick={handleClose}
            disabled={saving}
            className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition disabled:opacity-50"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Edit Profil</h2>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-4 relative">
              <div className="absolute inset-0 bg-orange-300/40 blur-2xl rounded-full"></div>
              <img
                src={photo || "icon/user.png"}
                alt="Profil"
                className="w-32 h-32 rounded-full object-cover border-4 border-orange-400 shadow-xl relative"
                onError={(e) => {
                  console.log("Image load error, using fallback");
                  e.target.src = "icon/user.png";
                }}
              />
            </div>
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50"
            >
              <Upload size={16} />
              {selectedFile ? "Ganti Foto" : "Ubah Foto"}
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={saving}
              className="hidden"
            />
            {selectedFile && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Foto dipilih: {selectedFile.name}
              </p>
            )}
            {errors.photo && (
              <p className="text-red-500 text-xs mt-2">{errors.photo}</p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-orange-500">👤</span>
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                disabled={saving}
                className={`w-full px-4 py-3 border-2 rounded-xl ${
                  errors.nama ? "border-red-500" : "border-orange-200"
                } focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 shadow-md`}
              />
              {errors.nama && (
                <p className="text-red-500 text-xs mt-1">{errors.nama}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-orange-500">📧</span>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={saving}
                className={`w-full px-4 py-3 border-2 rounded-xl ${
                  errors.email ? "border-red-500" : "border-orange-200"
                } focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 shadow-md`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-orange-500">📱</span>
              Nomor Telepon <span className="text-gray-400 text-sm">(Opsional)</span>
            </label>
            <input
              type="tel"
              name="telepon"
              value={formData.telepon}
              onChange={handleInputChange}
              disabled={saving}
              placeholder="Masukkan nomor telepon (opsional)"
              className={`w-full px-4 py-3 border-2 rounded-xl ${
                errors.telepon ? "border-red-500" : "border-orange-200"
              } focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 shadow-md`}
            />
            {errors.telepon && (
              <p className="text-red-500 text-xs mt-1">{errors.telepon}</p>
            )}
          </div>            {errors.submit && (
              <p className="text-red-500 text-sm text-center">{errors.submit}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Simpan Perubahan?</h3>
            <p className="text-gray-600 text-center mb-6">
              Anda memiliki perubahan yang belum disimpan. Apakah Anda ingin menyimpan perubahan terlebih dahulu?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDiscardChanges}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                Jangan Simpan
              </button>
              <button
                onClick={handleContinueEditing}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Lanjut Edit
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
