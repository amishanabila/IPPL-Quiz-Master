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

  return (
    <div className="border p-4 mb-4 rounded bg-white shadow">
      <h2 className="font-bold mb-2">Soal {index + 1}</h2>

      {/* Jenis soal */}
      <div className="mb-2">
        <label className="block font-semibold">Jenis Soal:</label>
        <select
          value={soal.jenis}
          onChange={(e) => handleJenisChange(index, e.target.value)}
          className="border p-2 rounded w-full border-gray-300"
        >
          <option value="pilihan_ganda">Pilihan Ganda</option>
          <option value="isian">Isian Singkat</option>
          <option value="essay">Essay</option>
        </select>
      </div>

      {/* Pertanyaan */}
      <textarea
        value={soal.soal}
        onChange={(e) => handleSoalChange(index, e.target.value)}
        className={`border p-2 rounded w-full mb-2 ${
          errors?.soal
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300"
        }`}
        placeholder="Tulis soal di sini..."
      />
      {errors?.soal && (
        <p className="text-red-500 text-sm mt-1">{errors.soal}</p>
      )}

      {/* Upload gambar */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleUploadGambar(index, e.target.files[0])}
        className="mb-2"
      />
      {soal.gambar && (
        <img
          src={soal.gambar}
          alt="Preview"
          className="w-32 h-32 object-cover mb-2 rounded"
        />
      )}

      {/* Pilihan ganda */}
      {soal.jenis === "pilihan_ganda" && (
        <div className="mt-3">
          <p className="font-semibold mb-2">Pilihan Jawaban:</p>
          {soal.opsi.map((opsi, idx) => (
            <div key={idx} className="flex items-center mb-2 gap-2">
              <span className="font-bold w-5">{getOptionLabel(idx)}.</span>
              <input
                type="text"
                value={opsi}
                onChange={(e) =>
                  handleOpsiChange(index, idx, e.target.value)
                }
                className={`border p-2 rounded flex-1 ${
                  errors?.opsi?.[idx]
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
                placeholder={`Opsi ${getOptionLabel(idx)}`}
              />
              {errors?.opsi?.[idx] && (
                <p className="text-red-500 text-sm">{errors.opsi[idx]}</p>
              )}
            </div>
          ))}
          <button
            onClick={() => tambahOpsi(index)}
            type="button"
            className="px-2 py-2 bg-green-500 hover:bg-green-700 text-white rounded text-sm font-semibold"
          >
            + Tambah Opsi
          </button>

          {/* Jawaban Benar */}
          <div className="mt-4">
            <label className="block font-semibold mb-1">Jawaban Benar:</label>
            <div className="flex flex-col md:flex-row gap-2 items-start">
              {soal.opsi.length > 0 && (
                <select
                  value={soal.jawabanHuruf || ""}
                  onChange={(e) => {
                    const huruf = e.target.value;
                    const idx = huruf ? huruf.charCodeAt(0) - 65 : -1;
                    const jawabanText = idx >= 0 ? soal.opsi[idx] : "";
                    handleJawabanChange(index, { text: jawabanText, huruf });
                  }}
                  className={`border p-2 rounded w-full md:w-32 ${
                    errors?.jawaban
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Pilih Huruf</option>
                  {soal.opsi.map((_, idx) => (
                    <option key={idx} value={String.fromCharCode(65 + idx)}>
                      {String.fromCharCode(65 + idx)}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                value={soal.jawaban || ""}
                onChange={(e) =>
                  handleJawabanChange(index, { text: e.target.value, huruf: "" })
                }
                className={`border p-2 rounded flex-1 ${
                  errors?.jawaban
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Jawaban yang sesuai (bisa di luar opsi)"
              />
            </div>
            {errors?.jawaban && (
              <p className="text-red-500 text-sm mt-1">{errors.jawaban}</p>
            )}
          </div>
        </div>
      )}

      {/* Isian singkat */}
      {soal.jenis === "isian" && (
        <>
          <input
            type="text"
            value={soal.jawaban}
            onChange={(e) =>
              handleJawabanChange(index, { huruf: "", text: e.target.value })
            }
            className={`border p-2 rounded w-full ${
              errors?.jawaban
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300"
            }`}
            placeholder="Jawaban singkat yang benar"
          />
          {errors?.jawaban && (
            <p className="text-red-500 text-sm mt-1">{errors.jawaban}</p>
          )}
        </>
      )}

      {/* Essay */}
      {soal.jenis === "essay" && (
        <>
          <textarea
            value={soal.jawaban}
            onChange={(e) =>
              handleJawabanChange(index, { huruf: "", text: e.target.value })
            }
            className={`border p-2 rounded w-full ${
              errors?.jawaban
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300"
            }`}
            placeholder="Contoh jawaban / kunci jawaban"
          />
          {errors?.jawaban && (
            <p className="text-red-500 text-sm mt-1">{errors.jawaban}</p>
          )}
        </>
      )}
    </div>
  );
}
