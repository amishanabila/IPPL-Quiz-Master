const BASE_URL = 'http://localhost:5000/api';

export const apiService = {
  // Auth API calls
  async register(data) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async login(data) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async resetPasswordRequest(email) {
    const response = await fetch(`${BASE_URL}/auth/reset-password-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  },

  // Kategori API calls
  async getKategori() {
    const response = await fetch(`${BASE_URL}/kategori`);
    return await response.json();
  },

  // Materi API calls
  async getMateri(kategoriId = null) {
    const url = kategoriId 
      ? `${BASE_URL}/materi?kategori_id=${kategoriId}`
      : `${BASE_URL}/materi`;
    const response = await fetch(url);
    return await response.json();
  },

  // Soal API calls
  async createKumpulanSoal(data, token) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async getKumpulanSoal(id) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan/${id}`);
    return await response.json();
  },

  async updateKumpulanSoal(id, data, token) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  // Quiz API calls
  async startQuiz(data) {
    const response = await fetch(`${BASE_URL}/quiz/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async submitQuiz(hasilId, data) {
    const response = await fetch(`${BASE_URL}/quiz/submit/${hasilId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async getQuizResults(hasilId) {
    const response = await fetch(`${BASE_URL}/quiz/results/${hasilId}`);
    return await response.json();
  },
};