import { ApiBase } from './apiBase';
import { API_CONFIG } from '../config/api.config';

export interface PublicUser {
  id: number;
  public_id: string;
  public_user_id: string;
  name: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  qr_code_data?: string;
  qr_code_url?: string;
  qr_code?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  user_id: string;
  name: string;
  nic?: string;
  email: string;
  username: string;
  role: 'admin' | 'staff' | 'public';
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: number;
  name: string;
  department_id: number;
  department_name?: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCatalog {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  department_id: number;
  division_id?: number;
  icon: string;
  fee_amount: number;
  required_documents: string[];
  processing_time_days: number;
  eligibility_criteria?: string;
  form_template_url?: string;
  status: string;
  department_name?: string;
  division_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenInfo {
  id?: number;
  token_number: string;
  estimated_wait_time: number;
  queue_position: number;
  status: string;
  service_name: string;
  is_next: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: number;
  recipient_id: number;
  recipient_type: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RegistryEntry {
  id: number;
  registry_id: string;
  public_user_id?: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_address?: string;
  visitor_phone?: string;
  department_id: number;
  division_id?: number;
  purpose_of_visit: string;
  remarks?: string;
  entry_time: string;
  visitor_type: 'new' | 'existing';
  status: 'active' | 'checked_out' | 'deleted';
  department_name?: string;
  division_name?: string;
  public_user_name?: string;
  public_user_id_ref?: string;
  updated_at?: string;
}

class ApiService extends ApiBase {
  // Tokens
  async getTokens(): Promise<any[]> {
    try {
      const response = await this.makeRequest(API_CONFIG.TOKENS);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw new Error('Failed to fetch tokens. Please try again.');
    }
  }

  // Users
  async getUsers(status?: string): Promise<User[]> {
    try {
      const url = status ? `${API_CONFIG.USERS.BASE}?status=${status}` : API_CONFIG.USERS.BASE;
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users. Please try again.');
    }
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.makeRequest(API_CONFIG.DEPARTMENTS);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw new Error('Failed to fetch departments. Please try again.');
    }
  }

  // Divisions
  async getDivisions(departmentId?: number): Promise<Division[]> {
    try {
      const url = departmentId 
        ? `${API_CONFIG.DIVISIONS}?department_id=${departmentId}`
        : API_CONFIG.DIVISIONS;
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching divisions:', error);
      throw new Error('Failed to fetch divisions. Please try again.');
    }
  }

  // Public Users
  async getPublicUsers(): Promise<PublicUser[]> {
    try {
      const response = await this.makeRequest(API_CONFIG.PUBLIC_USERS);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching public users:', error);
      throw new Error('Failed to fetch public users. Please try again.');
    }
  }

  // Notifications
  async getNotifications(recipientId: number, recipientType: 'public' | 'staff' | 'admin' = 'staff'): Promise<Notification[]> {
    try {
      const response = await this.makeRequest(
        `${API_CONFIG.NOTIFICATIONS}?recipient_id=${recipientId}&recipient_type=${recipientType}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications. Please try again.');
    }
  }

  // Service Catalog
  async getServices(): Promise<ServiceCatalog[]> {
    try {
      const response = await this.makeRequest(API_CONFIG.SERVICES);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw new Error('Failed to fetch services. Please try again.');
    }
  }

  // Add more methods for other API endpoints as needed
}

export const apiService = new ApiService();
