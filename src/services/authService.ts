
import { ApiBase } from './apiBase';
import { API_CONFIG } from '../config/api.config';

interface LoginData {
  username: string;
  password: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
  data?: {
    token?: string;
    user?: any;
  };
  status?: string;
}

// Define the expected user data structure
export interface UserData {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'public';
  status: 'active' | 'inactive' | 'pending';
  department_id?: number;
  created_at?: string;
  updated_at?: string;
}

export class AuthService extends ApiBase {
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      // Prepare the login data
      const loginData = {
        username: data.username.trim(),
        password: data.password,
        role: data.role
      };
      
      console.log('AuthService: Attempting login with:', { 
        username: loginData.username, 
        role: loginData.role,
        endpoint: '/auth/login.php' 
      });
      
      // Make the request with proper headers and JSON body
      const response = await this.makeRequest(API_CONFIG.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(loginData),
        // Headers are automatically added by ApiBase
      });
      
      console.log('AuthService: Raw response:', response);
      
      // Handle different response formats
      if (!response || typeof response !== 'object') {
        console.error('AuthService: Invalid response format - not an object:', response);
        throw new Error('Invalid response from server');
      }
      
          // Format 1: { status: 'success', message: '...', data: { user: {...}, token: '...' } }
      if (response.status === 'success' && response.data) {
        console.log('AuthService: Detected status:success format');
        
        // Validate required fields
        if (!response.data.token || !response.data.user) {
          console.error('AuthService: Missing token or user in response.data');
          throw new Error('Incomplete login data received from server');
        }
        
        // Store the token in localStorage
        localStorage.setItem('authToken', response.data.token);
        
        return {
          success: true,
          message: response.message || 'Login successful',
          token: response.data.token,
          user: response.data.user,
          data: response.data
        };
      }
      
      // Format 2: { success: true, message: '...', user: {...}, token: '...' }
      if (response.success === true) {
        console.log('AuthService: Detected success:true format');
        
        // Validate required fields
        if (!response.token || !response.user) {
          console.error('AuthService: Missing token or user in response');
          throw new Error('Incomplete login data received from server');
        }
        
        // Store the token in localStorage
        localStorage.setItem('authToken', response.token);
        
        return {
          success: true,
          message: response.message || 'Login successful',
          token: response.token,
          user: response.user
        };
      }
      
      // Handle error responses
      if (response.status === 'error' || response.success === false) {
        console.error('AuthService: Login failed:', response.message);
        throw new Error(response.message || 'Login failed. Please check your credentials.');
      }
      
      // If we get here, the response format is unexpected
      console.error('AuthService: Unexpected response format:', response);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('AuthService: Login request failed:', error);
      
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Network error during login. Please check your connection.');
    }
  }

  async updatePassword(data: { id: number; currentPassword: string; newPassword: string }): Promise<any> {
    try {
      const response = await this.makeRequest('/users/password.php', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response?.status === 'success') {
        return { success: true, message: response.message };
      }
      throw new Error(response?.message || 'Failed to update password');
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
