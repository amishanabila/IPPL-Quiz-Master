// Constants
const BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

export const authService = {
  // Register new user
  async register(userData) {
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        // Store token and user data
        localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // Login user
  async login(credentials) {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        // Store token and user data
        localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout() {
    // Remove token and user data from storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.error('Request password reset error:', error);
      throw error;
    }
  },

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Get current user data
  getCurrentUser() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  // Get fresh profile from backend (recommended to get foto from DB)
  async getProfile() {
    try {
      const token = this.getToken();
      const res = await fetch(`${BASE_URL}/user/me`, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      return await res.json();
    } catch (err) {
      console.error('getProfile error', err);
      throw err;
    }
  },

  // Update profile (supports multipart/form-data for photo)
  async updateProfile(formData) {
    try {
      const token = this.getToken();
      const res = await fetch(`${BASE_URL}/user/me`, {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
          // NOTE: Do not set Content-Type for FormData
        },
        body: formData
      });
      const data = await res.json();
      // Do NOT force-save photo to localStorage; update stored userData (without foto) if present
      if (data.status === 'success' && data.data && data.data.user) {
        // update local stored user data but avoid saving the foto field in localStorage
        const stored = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
        const userUpdate = { ...stored, ...data.data.user };
        if (userUpdate.foto) delete userUpdate.foto; // do not persist foto in localStorage
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userUpdate));
      }
      return data;
    } catch (err) {
      console.error('updateProfile error', err);
      throw err;
    }
  },

  // Get auth token
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
};

export default authService;