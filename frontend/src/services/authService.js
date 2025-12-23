// Constants
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
      
      // Don't auto-login after registration
      // User should manually login after successful registration
      
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
      
      console.log('🔍 AuthService - Response dari backend:', data);
      
      // Backend mengembalikan: { status: 'success', data: { user, token } }
      if (data.status === 'success' && data.data && data.data.token) {
        // Store token
        localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
        
        // Store user data without foto
        const userData = { ...data.data.user };
        delete userData.foto;
        
        console.log('✅ AuthService - Data dari backend:', data.data.user);
        console.log('👤 AuthService - Role dari backend:', data.data.user.role);
        
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        localStorage.setItem('userRole', userData.role); // Simpan role untuk validasi
        
        console.log('✅ AuthService - Token dan user data tersimpan');
        console.log('✅ AuthService - User data tersimpan:', userData);
        console.log('👤 AuthService - User role tersimpan:', userData.role);
        console.log('📦 AuthService - localStorage userRole:', localStorage.getItem('userRole'));
        
        // Verify storage
        const verifyRole = localStorage.getItem('userRole');
        if (verifyRole !== userData.role) {
          console.error('❌ AuthService - Role mismatch!');
          console.error('   Expected:', userData.role);
          console.error('   Stored:', verifyRole);
        } else {
          console.log('✅ AuthService - Role verified:', verifyRole);
        }
        
        // Return format yang sudah benar
        return {
          status: 'success',
          data: {
            token: data.data.token,
            user: userData
          }
        };
      }
      
      console.log('❌ AuthService - Login gagal:', data);
      return data;
    } catch (error) {
      console.error('❌ AuthService - Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout() {
    console.log('🚪 AuthService - Logout, membersihkan semua data');
    
    // Remove token and user data from storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem('userRole');
    
    // Clear any other session data that might exist
    localStorage.removeItem('loginDestination');
    
    // Clear window variables
    if (window.autoRedirectTimer) {
      clearTimeout(window.autoRedirectTimer);
      window.autoRedirectTimer = null;
    }
    window.loginDestination = null;
    
    console.log('✅ AuthService - Semua data session berhasil dihapus');
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
      if (!token) {
        throw new Error('No auth token found');
      }
      
      const res = await fetch(`${BASE_URL}/user/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 401) {
          throw new Error(`401 - Token is not valid`);
        }
        throw new Error(`HTTP Error: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const data = await res.json();
      
      // Update localStorage with fresh data (without foto)
      if (data.status === 'success' && data.data && data.data.user) {
        const userData = { ...data.data.user };
        delete userData.foto;
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      }
      
      return data;
    } catch (err) {
      console.error('getProfile error:', err);
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
      // Update stored userData without foto field (foto comes from database)
      if (data.status === 'success' && data.data && data.data.user) {
        const stored = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
        const userUpdate = { ...stored, ...data.data.user };
        // Remove foto from localStorage; always fetch from database
        delete userUpdate.foto;
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
  },

  // Check if user is admin
  isAdmin() {
    const role = localStorage.getItem('userRole');
    return role === 'admin';
  },

  // Get user role
  getUserRole() {
    return localStorage.getItem('userRole');
  },

  // Delete account
  async deleteAccount() {
    try {
      const token = this.getToken();
      const response = await fetch(`${BASE_URL}/user/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.status === 'success' || data.success) {
        // Clear all auth data
        this.logout();
      }
      
      return data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }
};

export default authService;