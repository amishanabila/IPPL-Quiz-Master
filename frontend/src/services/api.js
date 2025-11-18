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

  async getKategoriById(id) {
    const response = await fetch(`${BASE_URL}/kategori/${id}`);
    return await response.json();
  },

  async createKategori(data, token) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/kategori`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async updateKategori(id, data, token) {
    const response = await fetch(`${BASE_URL}/kategori/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async deleteKategori(id, token) {
    const response = await fetch(`${BASE_URL}/kategori/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
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

  async getMateriById(id) {
    const response = await fetch(`${BASE_URL}/materi/${id}`);
    return await response.json();
  },

  async createMateri(data, token) {
    const response = await fetch(`${BASE_URL}/materi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async updateMateri(id, data, token) {
    const response = await fetch(`${BASE_URL}/materi/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async deleteMateri(id, token) {
    const response = await fetch(`${BASE_URL}/materi/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
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

  async deleteKumpulanSoal(id, token) {
    const response = await fetch(`${BASE_URL}/soal/kumpulan/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  async getSoalByKategori(kategoriId) {
    const response = await fetch(`${BASE_URL}/soal/kategori/${kategoriId}`);
    return await response.json();
  },

  async getSoalByMateri(materiId) {
    const response = await fetch(`${BASE_URL}/soal/materi/${materiId}`);
    return await response.json();
  },

  // Quiz API calls
  async generatePin(data) {
    const response = await fetch(`${BASE_URL}/quiz/generate-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async validatePin(pin) {
    const response = await fetch(`${BASE_URL}/quiz/validate-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    });
    return await response.json();
  },

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

  // Leaderboard API calls
  async getLeaderboard() {
    const response = await fetch(`${BASE_URL}/leaderboard`);
    return await response.json();
  },

  async resetLeaderboard() {
    const response = await fetch(`${BASE_URL}/leaderboard/reset`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  },
};