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

  // Get auth token
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
};

export default authService;