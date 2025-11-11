import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function HalamanAwalPeserta() {
  const navigate = useNavigate();
  const [step, setStep] = useState("pin"); // "pin" atau "nama"
  const [pin, setPin] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setErrors("");

    // Validasi PIN
    if (!pin || pin.trim() === "") {
      setErrors("PIN wajib diisi");
      return;
    }

    if (pin.length < 4) {
      setErrors("PIN minimal 4 karakter");
      return;
    }

    // Validasi PIN format (hanya angka dan spasi)
    if (!/^[\d\s]+$/.test(pin)) {
      setErrors("PIN hanya boleh berisi angka dan spasi");
      return;
    }

    // Move to nama step
    setStep("nama");
    setErrors("");
  };

  const handleNamaSubmit = async (e) => {
    e.preventDefault();
    setErrors("");

    // Validasi nama
    if (!nama || nama.trim() === "") {
      setErrors("Nama wajib diisi");
      return;
    }

    if (nama.length < 2) {
      setErrors("Nama minimal 2 karakter");
      return;
    }

    // Validasi nama format (hanya huruf dan spasi)
    if (!/^[A-Za-z\s]+$/.test(nama)) {
      setErrors("Nama hanya boleh berisi huruf dan spasi");
      return;
    }

    setLoading(true);

    // Simulasi delay API call (jika ada)
    setTimeout(() => {
      // Store data peserta
      const pesertaData = {
        pin: pin.replace(/\s+/g, ''), // Remove spaces
        nama: nama.trim(),
        joinedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pesertaData', JSON.stringify(pesertaData));

      // Redirect ke soal berdasarkan PIN
      // Anda bisa ubah slug sesuai kebutuhan
      const slug = `soal-${pin.replace(/\s+/g, '-').toLowerCase()}`;
      
      setLoading(false);
      navigate(`/soal/${slug}`, { state: { pin, nama } });
    }, 500);
  };

  const handleBackToPinStep = () => {
    setStep("pin");
    setNama("");
    setErrors("");
  };

  return (
    <div className="min-h-screen bg-yellow-200 flex flex-col">
      <div className="flex items-center justify-center flex-1 p-4">
        <div className="bg-yellow-50 p-6 sm:p-8 rounded-xl shadow-md w-full max-w-md">
          {step === "pin" ? (
            // Step 1: PIN Input
            <>
              <h1 className="text-2xl font-bold text-center mb-6">Ikuti Quiz</h1>
              <p className="text-gray-700 text-center mb-6">Masukkan PIN yang diberikan oleh guru</p>

              <form className="flex flex-col gap-4" onSubmit={handlePinSubmit}>
                <div className="flex flex-col">
                  <label htmlFor="pin" className="mb-2 font-medium">Masukkan PIN:</label>
                  <input
                    type="text"
                    id="pin"
                    placeholder="Contoh: 123456"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    disabled={loading}
                    className={`border-2 rounded px-4 py-3 text-center text-lg font-semibold bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors && <p className="text-red-500 text-sm mt-2">{errors}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-400 hover:bg-orange-700 hover:text-white text-black font-bold py-3 rounded-full shadow transition-colors duration-200 w-full flex justify-center items-center"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Lanjutkan"}
                </button>
              </form>
            </>
          ) : (
            // Step 2: Nama Input
            <>
              <h1 className="text-2xl font-bold text-center mb-2">Selamat Datang!</h1>
              <p className="text-gray-700 text-center mb-6 text-sm">Silakan masukkan nama Anda</p>

              <form className="flex flex-col gap-4" onSubmit={handleNamaSubmit}>
                <div className="flex flex-col">
                  <label htmlFor="nama" className="mb-2 font-medium">Nama Lengkap:</label>
                  <input
                    type="text"
                    id="nama"
                    placeholder="Masukkan nama Anda"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    disabled={loading}
                    className={`border-2 rounded px-4 py-3 bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors && <p className="text-red-500 text-sm mt-2">{errors}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackToPinStep}
                    disabled={loading}
                    className="flex-1 bg-gray-400 hover:bg-gray-600 text-white font-bold py-3 rounded-full shadow transition-colors duration-200"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-400 hover:bg-orange-700 hover:text-white text-black font-bold py-3 rounded-full shadow transition-colors duration-200 flex justify-center items-center"
                  >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Mulai"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
