import React, { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, CheckCircle, XCircle, List } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EksporDataKreator() {
  const [exportPopup, setExportPopup] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showQuizList, setShowQuizList] = useState(false);
  const [quizList, setQuizList] = useState([]);

  // Function to convert JSON to Excel and download
  const downloadExcel = (data, headers, headerLabels, filename) => {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Prepare data with formatted values
    const formattedData = data.map(row => {
      const formattedRow = {};
      
      headers.forEach((header, index) => {
        const label = headerLabels ? headerLabels[index] : header;
        let value = row[header];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          formattedRow[label] = '';
          return;
        }
        
        // Special handling for variasi_jawaban (JSON array)
        if (header === 'variasi_jawaban') {
          if (value) {
            try {
              // Parse if string, otherwise use as-is
              const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
              if (Array.isArray(parsedValue)) {
                // Join array with comma for readability
                formattedRow[label] = parsedValue.join(', ');
              } else {
                formattedRow[label] = String(value);
              }
            } catch (e) {
              // If parsing fails, use as string
              formattedRow[label] = String(value);
            }
          } else {
            formattedRow[label] = '';
          }
          return;
        }
        
        // Format dates
        if (header.includes('_at') || header.includes('date') || header.includes('selesai')) {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              formattedRow[label] = `${day}/${month}/${year} ${hours}:${minutes}`;
              return;
            }
          } catch (e) {
            // If date parsing fails, use original value
          }
        }
        
        // Format numbers
        if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            formattedRow[label] = value;
          } else {
            formattedRow[label] = Number(value.toFixed(2));
          }
          return;
        }
        
        // All other values
        formattedRow[label] = value;
      });
      
      return formattedRow;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Auto-size columns
    const maxWidth = 50;
    const colWidths = [];
    
    // Calculate column widths based on header and data
    if (headerLabels) {
      headerLabels.forEach((header, i) => {
        const headerWidth = header.length;
        const dataWidth = Math.max(...formattedData.map(row => {
          const val = String(row[header] || '');
          return val.length;
        }));
        colWidths.push({ wch: Math.min(Math.max(headerWidth, dataWidth) + 2, maxWidth) });
      });
    }
    
    worksheet['!cols'] = colWidths;
    
    // Generate Excel file and download
    const excelFilename = filename.replace('.csv', '.xlsx');
    XLSX.writeFile(workbook, excelFilename);
    
    console.log('✅ Excel file downloaded:', excelFilename);
  };

  // Fetch quiz list for kreator
  const fetchQuizList = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setExportPopup({
          show: true,
          message: 'Anda harus login terlebih dahulu',
          type: 'error'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/soal/export/my-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesi login Anda telah berakhir. Silakan login kembali.');
        }
        throw new Error('Gagal mengambil daftar quiz');
      }

      const result = await response.json();
      console.log('📋 Quiz list response:', result);
      
      if (result.success && result.data && result.data.kumpulan_soal) {
        const quizzes = result.data.kumpulan_soal || [];
        console.log('📋 Found quizzes:', quizzes.length);
        
        if (quizzes.length > 0) {
          setQuizList(quizzes);
          setShowQuizList(true);
        } else {
          setExportPopup({
            show: true,
            message: 'Anda belum membuat quiz. Silakan buat quiz terlebih dahulu.',
            type: 'error'
          });
        }
      } else {
        setExportPopup({
          show: true,
          message: 'Tidak ada quiz yang ditemukan',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching quiz list:', error);
      setExportPopup({
        show: true,
        message: error.message || 'Gagal mengambil daftar quiz',
        type: 'error'
      });
    }
  };

  // Export all kreator data
  const handleExportMyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setExportPopup({
          show: true,
          message: 'Anda harus login terlebih dahulu',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/soal/export/my-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesi login Anda telah berakhir. Silakan login kembali.');
        }
        throw new Error('Export gagal');
      }

      const result = await response.json();
      console.log('📊 Export response:', result);
      console.log('📊 Data structure:', {
        has_data: !!result.data,
        kumpulan_soal_length: result.data?.kumpulan_soal?.length || 0,
        hasil_quiz_length: result.data?.hasil_quiz?.length || 0
      });
      
      if (result.success && result.data) {
        let filesDownloaded = 0;
        let messages = [];
        
        // Export kumpulan soal
        const kumpulanSoal = result.data.kumpulan_soal || [];
        if (kumpulanSoal.length > 0) {
          console.log('📝 Exporting kumpulan soal:', kumpulanSoal.length, 'items');
          console.log('📝 Sample data:', kumpulanSoal[0]);
          
          const kumpulanHeaders = [
            'kumpulan_soal_id', 'judul', 'nama_kategori', 'materi_judul',
            'jumlah_soal', 'pin_code', 'waktu_per_soal', 'waktu_keseluruhan',
            'tipe_waktu', 'total_peserta', 'rata_rata_score', 'created_at', 'updated_at'
          ];
          const kumpulanHeaderLabels = [
            'ID Quiz', 'Judul Quiz', 'Kategori', 'Materi',
            'Jumlah Soal', 'Kode PIN', 'Waktu per Soal', 'Waktu Keseluruhan',
            'Tipe Waktu', 'Total Peserta', 'Rata-rata Skor', 'Dibuat Pada', 'Diperbarui Pada'
          ];
          downloadExcel(
            kumpulanSoal, 
            kumpulanHeaders, 
            kumpulanHeaderLabels, 
            `kumpulan_soal_${new Date().toISOString().split('T')[0]}.xlsx`
          );
          filesDownloaded++;
          messages.push(`${kumpulanSoal.length} kumpulan soal`);
          console.log('✅ Downloaded: kumpulan_soal.xlsx');
        } else {
          console.log('⚠️ No kumpulan soal data to export');
          messages.push('Tidak ada kumpulan soal');
        }

        // Export hasil quiz
        const hasilQuiz = result.data.hasil_quiz || [];
        if (hasilQuiz.length > 0) {
          console.log('📝 Exporting hasil quiz:', hasilQuiz.length, 'items');
          console.log('📝 Sample data:', hasilQuiz[0]);
          
          const hasilHeaders = [
            'hasil_id', 'nama_peserta', 'email_peserta', 'judul_quiz',
            'nama_kategori', 'score', 'jumlah_benar', 'jumlah_salah', 'completed_at'
          ];
          const hasilHeaderLabels = [
            'ID Hasil', 'Nama Peserta', 'Email Peserta', 'Judul Quiz',
            'Kategori', 'Skor', 'Jawaban Benar', 'Jawaban Salah', 'Selesai Pada'
          ];
          downloadExcel(
            hasilQuiz, 
            hasilHeaders, 
            hasilHeaderLabels, 
            `hasil_quiz_${new Date().toISOString().split('T')[0]}.xlsx`
          );
          filesDownloaded++;
          messages.push(`${hasilQuiz.length} hasil quiz`);
          console.log('✅ Downloaded: hasil_quiz.xlsx');
        } else {
          console.log('⚠️ No hasil quiz data to export');
          messages.push('Tidak ada hasil quiz');
        }

        if (filesDownloaded > 0) {
          setExportPopup({
            show: true,
            message: `Data berhasil diekspor! File Excel telah diunduh: ${messages.join(', ')}.`,
            type: 'success'
          });
        } else {
          setExportPopup({
            show: true,
            message: `Anda belum memiliki data untuk diekspor. Silakan buat quiz terlebih dahulu.`,
            type: 'error'
          });
        }
      } else {
        console.error('❌ Invalid response structure:', result);
        throw new Error('Data tidak ditemukan');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setExportPopup({
        show: true,
        message: 'Gagal mengekspor data. Silakan coba lagi.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Export specific quiz detail
  const handleExportQuizDetail = async (kumpulanSoalId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setExportPopup({
          show: true,
          message: 'Anda harus login terlebih dahulu',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/soal/export/quiz/${kumpulanSoalId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesi login Anda telah berakhir. Silakan login kembali.');
        }
        throw new Error('Export gagal');
      }

      const result = await response.json();
      console.log('📊 Export quiz detail response:', result);
      
      if (result.success && result.data) {
        const { info, soal, hasil_quiz } = result.data;
        const quizTitle = (info?.judul || 'quiz').replace(/[^a-z0-9]/gi, '_');
        let filesDownloaded = 0;

        console.log('📝 Quiz info:', info);
        console.log('📝 Soal count:', soal?.length || 0);
        console.log('📝 Hasil quiz count:', hasil_quiz?.length || 0);

        // Export soal
        if (soal && soal.length > 0) {
          console.log('📝 Exporting soal...');
          const soalHeaders = [
            'soal_id', 'pertanyaan', 'pilihan_a', 'pilihan_b',
            'pilihan_c', 'pilihan_d', 'jawaban_benar', 'variasi_jawaban'
          ];
          const soalHeaderLabels = [
            'ID Soal', 'Pertanyaan', 'Pilihan A', 'Pilihan B',
            'Pilihan C', 'Pilihan D', 'Jawaban Benar', 'Variasi Jawaban'
          ];
          downloadExcel(
            soal, 
            soalHeaders, 
            soalHeaderLabels, 
            `soal_${quizTitle}_${new Date().toISOString().split('T')[0]}.xlsx`
          );
          filesDownloaded++;
          console.log('✅ Downloaded: soal Excel');
        }

        // Export hasil quiz
        if (hasil_quiz && hasil_quiz.length > 0) {
          console.log('📝 Exporting hasil quiz...');
          const hasilHeaders = [
            'hasil_id', 'nama_peserta', 'email_peserta',
            'score', 'jumlah_benar', 'jumlah_salah', 'completed_at'
          ];
          const hasilHeaderLabels = [
            'ID Hasil', 'Nama Peserta', 'Email Peserta',
            'Skor', 'Jawaban Benar', 'Jawaban Salah', 'Selesai Pada'
          ];
          downloadExcel(
            hasil_quiz, 
            hasilHeaders, 
            hasilHeaderLabels, 
            `hasil_${quizTitle}_${new Date().toISOString().split('T')[0]}.xlsx`
          );
          filesDownloaded++;
          console.log('✅ Downloaded: hasil Excel');
        }

        if (filesDownloaded > 0) {
          setExportPopup({
            show: true,
            message: `Detail quiz berhasil diekspor! ${filesDownloaded} file Excel telah diunduh.`,
            type: 'success'
          });
        } else {
          setExportPopup({
            show: true,
            message: 'Quiz ini belum memiliki data untuk diekspor.',
            type: 'error'
          });
        }
      } else {
        throw new Error('Data tidak ditemukan');
      }
    } catch (error) {
      console.error('Error exporting quiz detail:', error);
      setExportPopup({
        show: true,
        message: 'Gagal mengekspor detail quiz. Silakan coba lagi.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Export Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">Ekspor Data</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export All Data */}
          <button
            onClick={handleExportMyData}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            <span>Ekspor Semua Data Saya</span>
          </button>

          {/* Export Quiz Results */}
          <button
            onClick={fetchQuizList}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <List className="w-5 h-5" />
            <span>Ekspor Detail Quiz Tertentu</span>
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>📊 Ekspor Semua Data:</strong> Mengunduh semua kumpulan soal dan hasil quiz yang Anda buat dalam format Excel (.xlsx).
          </p>
          <p className="text-sm text-gray-700 mt-2">
            <strong>📝 Ekspor Detail Quiz:</strong> Mengunduh detail soal dan hasil quiz tertentu dalam format Excel (.xlsx).
          </p>
        </div>
      </div>

      {/* Export Popup */}
      {exportPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
            <div className="flex flex-col items-center">
              {exportPopup.type === 'success' ? (
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
              )}
              <h3 className={`text-xl font-bold mb-2 ${
                exportPopup.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {exportPopup.type === 'success' ? 'Berhasil!' : 'Gagal!'}
              </h3>
              <p className="text-gray-700 text-center mb-6">
                {exportPopup.message}
              </p>
              <button
                onClick={() => setExportPopup({ show: false, message: '', type: '' })}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-8 rounded-lg transition-all duration-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz List Modal */}
      {showQuizList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-gray-800">Pilih Quiz untuk Diekspor</h3>
              <p className="text-gray-600 mt-2">Klik pada quiz yang ingin Anda ekspor detail-nya</p>
            </div>
            
            <div className="p-6">
              {quizList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tidak ada quiz yang tersedia</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {quizList.map((quiz) => (
                    <div
                      key={quiz.kumpulan_soal_id}
                      onClick={() => {
                        setShowQuizList(false);
                        handleExportQuizDetail(quiz.kumpulan_soal_id);
                      }}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 p-4 rounded-xl border border-blue-200 cursor-pointer transition-all duration-200 transform hover:scale-102 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-800">{quiz.judul || 'Quiz Tanpa Judul'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            📚 {quiz.nama_kategori} | 📝 {quiz.jumlah_soal} Soal | 🔑 PIN: {quiz.pin_code}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            👥 {quiz.total_peserta || 0} Peserta | 
                            {quiz.rata_rata_score !== null ? ` ⭐ Rata-rata: ${parseFloat(quiz.rata_rata_score).toFixed(1)}` : ' Belum ada hasil'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">
                            {new Date(quiz.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
              <button
                onClick={() => setShowQuizList(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}