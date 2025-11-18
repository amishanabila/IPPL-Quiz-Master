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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
          <button
            onClick={handleClose}
            disabled={saving}
            className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition disabled:opacity-50"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold text-center mb-6">Edit Profil</h2>

          <div className="text-center mb-6">
            <img
              src={photo || "user.png"}
              alt="Profil"
              className="w-32 h-32 rounded-full object-cover border-4 border-yellow-300 mx-auto mb-3"
              onError={(e) => {
                console.log("Image load error, using fallback");
                e.target.src = "user.png";
              }}
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full cursor-pointer transition disabled:opacity-50"
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
              <label className="block font-semibold text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                disabled={saving}
                className={`w-full px-3 py-2 border rounded ${
                  errors.nama ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100`}
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
                disabled={saving}
                className={`w-full px-3 py-2 border rounded ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Nomor Telepon <span className="text-gray-400 text-sm">(Opsional)</span>
            </label>
            <input
              type="tel"
              name="telepon"
              value={formData.telepon}
              onChange={handleInputChange}
              disabled={saving}
              placeholder="Masukkan nomor telepon (opsional)"
              className={`w-full px-3 py-2 border rounded ${
                errors.telepon ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100`}
            />
            {errors.telepon && (
              <p className="text-red-500 text-xs mt-1">{errors.telepon}</p>
            )}
          </div>            {errors.submit && (
              <p className="text-red-500 text-sm text-center">{errors.submit}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-500 text-black font-bold rounded-full transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Simpan Perubahan?</h3>
            <p className="text-gray-600 mb-6">
              Anda memiliki perubahan yang belum disimpan. Apakah Anda ingin menyimpan perubahan terlebih dahulu?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDiscardChanges}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded-lg transition"
              >
                Jangan Simpan
              </button>
              <button
                onClick={handleContinueEditing}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition"
              >
                Lanjut Edit
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition disabled:opacity-50"
              >
                {saving ? "Simpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
