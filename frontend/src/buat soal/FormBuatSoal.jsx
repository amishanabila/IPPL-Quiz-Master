import React from "react";

export default function FormBuatSoal({
  index,
  soal,
  errors,
  handleSoalChange,
  handleUploadGambar,
  handleOpsiChange,
  tambahOpsi,
  handleJenisChange,
  handleJawabanChange,
}) {
  const getOptionLabel = (idx) => String.fromCharCode(65 + idx);

  // Dynamic colors based on question type
  const typeColors = {
    pilihan_ganda: {
      border: 'border-blue-300',
      bg: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      icon: '🔵',
      label: 'Pilihan Ganda'
    },
    isian: {
      border: 'border-green-300',
      bg: 'bg-green-50',
      gradient: 'from-green-500 to-green-600',
      icon: '🟢',
      label: 'Isian Singkat'
    }
  };

  const currentType = typeColors[soal.jenis] || typeColors.pilihan_ganda;

  return (
    <div className={`border-3 ${currentType.border} p-6 mb-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
      {/* Header dengan type badge */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${currentType.gradient} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {index + 1}
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-800">Soal {index + 1}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <span>{currentType.icon}</span>
              <span className="font-medium">{currentType.label}</span>
            </p>
          </div>
        </div>
        {/* Quick type switcher badge */}
        <div className={`px-4 py-2 ${currentType.bg} ${currentType.border} border-2 rounded-lg font-semibold text-sm`}>
          {currentType.icon} {currentType.label}
        </div>
      </div>

      {/* Jenis soal - Enhanced */}
      <div className="mb-6">
        <label className="block font-bold text-gray-800 mb-3 flex items-center gap-2 text-base">
          <span className="text-xl">🎯</span> 
          <span>Tipe Soal</span>
        </label>
        <select
          value={soal.jenis}
          onChange={(e) => handleJenisChange(index, e.target.value)}
          className={`border-3 ${currentType.border} p-4 rounded-xl w-full focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all hover:border-blue-400 font-semibold text-gray-700 bg-white shadow-sm cursor-pointer`}
        >
          <option value="pilihan_ganda">🔵 Pilihan Ganda - Peserta pilih satu jawaban benar</option>
          <option value="isian">🟢 Isian Singkat - Peserta ketik jawaban singkat</option>
        </select>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Pilih tipe soal yang sesuai dengan kebutuhan quiz Anda
        </p>
      </div>

      {/* Pertanyaan - Enhanced */}
      <div className="mb-6">
        <label className="block font-bold text-gray-800 mb-3 flex items-center gap-2 text-base">
          <span className="text-xl">❓</span>
          <span>Pertanyaan</span>
          <span className="text-red-500 text-lg">*</span>
        </label>
        <textarea
          value={soal.soal}
          onChange={(e) => handleSoalChange(index, e.target.value)}
          rows="4"
          className={`border-2 p-4 rounded-xl w-full transition-all font-medium text-gray-700 ${
            errors?.soal
              ? "border-red-500 focus:ring-4 focus:ring-red-100 focus:border-red-500 bg-red-50"
              : "border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300"
          }`}
          placeholder="Tulis pertanyaan soal dengan jelas dan lengkap di sini..."
        />
        {errors?.soal && (
          <div className="flex items-center gap-2 mt-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-semibold">{errors.soal}</p>
          </div>
        )}
      </div>

      {/* Upload gambar - Enhanced */}
      <div className="mb-6">
        <label className="block font-bold text-gray-800 mb-3 flex items-center gap-2 text-base">
          <span className="text-xl">🖼️</span>
          <span>Gambar Soal (Opsional)</span>
        </label>
        <div className="flex items-start gap-4">
          <label className="cursor-pointer">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Pilih Gambar</span>
            </div>
            <input
              key={soal.gambar ? 'has-image' : 'no-image'} // Reset input ketika gambar dihapus
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  console.log('📁 File dipilih:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
                  handleUploadGambar(index, file);
                  e.target.value = ''; // Reset value untuk allow re-upload file yang sama
                }
              }}
              className="hidden"
            />
          </label>
          {soal.gambar && (
            <div className="relative group">
              <img
                src={soal.gambar}
                alt="Preview"
                className="w-40 h-40 object-cover rounded-xl border-4 border-blue-200 shadow-lg group-hover:shadow-xl transition-shadow"
                onLoad={() => console.log('✅ Gambar berhasil dimuat untuk soal', index + 1)}
                onError={(e) => {
                  console.error('❌ Gagal memuat gambar untuk soal', index + 1);
                  console.error('Gambar src:', soal.gambar?.substring(0, 50) + '...');
                }}
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Terpilih
              </div>
              {/* Tombol Hapus Gambar */}
              <button
                type="button"
                onClick={() => handleUploadGambar(index, null)}
                className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100"
                title="Hapus gambar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Tambahkan gambar untuk memperjelas soal (maks. 5MB)
        </p>
      </div>

      {/* Pilihan ganda - Enhanced */}
      {soal.jenis === "pilihan_ganda" && (
        <div className="mt-2">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-4">
            <p className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base">
              <span className="text-xl">📝</span>
              <span>Pilihan Jawaban</span>
              <span className="text-red-500 text-lg">*</span>
            </p>
            <div className="space-y-3">
            {soal.opsi.map((opsi, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 mt-1">
                  {getOptionLabel(idx)}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={opsi}
                    onChange={(e) =>
                      handleOpsiChange(index, idx, e.target.value)
                    }
                    className={`border-2 p-3 rounded-lg w-full transition-all font-medium ${
                      errors?.opsi?.[idx]
                        ? "border-red-500 focus:ring-4 focus:ring-red-100 focus:border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300"
                    }`}
                    placeholder={`Masukkan teks untuk opsi ${getOptionLabel(idx)}`}
                  />
                  {errors?.opsi?.[idx] && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {errors.opsi[idx]}
                    </p>
                  )}
                </div>
              </div>
            ))}
            </div>
            <button
              onClick={() => tambahOpsi(index)}
              type="button"
              className="mt-4 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Tambah Opsi</span>
            </button>
          </div>

          {/* Jawaban Benar */}
          <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-5">
            <label className="block font-bold text-gray-800 mb-3 flex items-center gap-2 text-base">
              <span className="text-xl">✅</span>
              <span>Jawaban Benar</span>
              <span className="text-red-500 text-lg">*</span>
            </label>
            <div className="flex flex-col md:flex-row gap-3 items-start">
              {soal.opsi.length > 0 && (
                <div className="w-full md:w-40">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Pilih Huruf</label>
                  <select
                    value={soal.jawabanHuruf || ""}
                    onChange={(e) => {
                      const huruf = e.target.value;
                      const idx = huruf ? huruf.charCodeAt(0) - 65 : -1;
                      const jawabanText = idx >= 0 ? soal.opsi[idx] : "";
                      handleJawabanChange(index, { text: jawabanText, huruf });
                    }}
                    className={`border-2 p-3 rounded-lg w-full font-bold text-center transition-all ${
                      errors?.jawaban
                        ? "border-red-500 focus:ring-4 focus:ring-red-100 focus:border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-green-300"
                    }`}
                  >
                    <option value="">-- Pilih --</option>
                    {soal.opsi.map((_, idx) => (
                      <option key={idx} value={String.fromCharCode(65 + idx)}>
                        {String.fromCharCode(65 + idx)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Atau Ketik Manual</label>
                <input
                  type="text"
                  value={soal.jawaban || ""}
                  onChange={(e) =>
                    handleJawabanChange(index, { text: e.target.value, huruf: "" })
                  }
                  className={`border-2 p-3 rounded-lg w-full font-medium transition-all ${
                    errors?.jawaban
                      ? "border-red-500 focus:ring-4 focus:ring-red-100 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-green-300"
                  }`}
                  placeholder="Jawaban yang sesuai (bisa di luar opsi)"
                />
              </div>
            </div>
            {errors?.jawaban && (
              <div className="flex items-center gap-2 mt-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-semibold">{errors.jawaban}</p>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Pilih huruf dari opsi atau ketik manual jawaban yang benar
            </p>
          </div>
        </div>
      )}

      {/* Isian singkat - Multiple jawaban - Enhanced */}
      {soal.jenis === "isian" && (
        <div className="mt-2">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
            <p className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-base">
              <span className="text-xl">✅</span>
              <span>Jawaban yang Benar</span>
              <span className="text-red-500 text-lg">*</span>
            </p>
            <p className="text-sm text-gray-600 mb-4 bg-white p-3 rounded-lg border border-green-200">
              💡 <strong>Tips:</strong> Masukkan semua variasi jawaban yang diterima. Peserta cukup menjawab salah satu untuk mendapat nilai benar.
            </p>
            
            {/* Render jawaban as array */}
            {(() => {
            // Ensure jawaban is array
            const jawabanArray = Array.isArray(soal.jawaban) 
              ? soal.jawaban 
              : soal.jawaban 
                ? [soal.jawaban] 
                : [""];
            
            return (
              <div className="space-y-3">
                {jawabanArray.map((jawab, jawabanIdx) => (
                  <div key={jawabanIdx} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 mt-1">
                      {jawabanIdx + 1}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={jawab}
                        onChange={(e) => {
                          const newJawabanArray = [...jawabanArray];
                          newJawabanArray[jawabanIdx] = e.target.value;
                          handleJawabanChange(index, { 
                            huruf: "", 
                            text: newJawabanArray
                          });
                        }}
                        className={`border-2 p-3 rounded-lg w-full transition-all font-medium ${
                          errors?.jawaban
                            ? "border-red-500 focus:ring-4 focus:ring-red-100 focus:border-red-500 bg-red-50"
                            : "border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-green-300"
                        }`}
                        placeholder={`Jawaban ${jawabanIdx + 1} (contoh: ${jawabanIdx === 0 ? 'gaya katak' : jawabanIdx === 1 ? 'gaya renang katak' : 'katak'})`}
                      />
                    </div>
                    {jawabanArray.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newJawabanArray = jawabanArray.filter((_, i) => i !== jawabanIdx);
                          handleJawabanChange(index, { 
                            huruf: "", 
                            text: newJawabanArray.length > 0 ? newJawabanArray : [""]
                          });
                        }}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 mt-1"
                        title="Hapus jawaban ini"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
          
          <button
            type="button"
            onClick={() => {
              const jawabanArray = Array.isArray(soal.jawaban) 
                ? soal.jawaban 
                : soal.jawaban 
                  ? [soal.jawaban] 
                  : [""];
              handleJawabanChange(index, { 
                huruf: "", 
                text: [...jawabanArray, ""]
              });
            }}
            className="mt-4 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Tambah Variasi Jawaban</span>
          </button>
          
          {errors?.jawaban && (
            <div className="flex items-center gap-2 mt-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold">{errors.jawaban}</p>
            </div>
          )}
          </div>
        </div>
      )}

    </div>
  );
}
