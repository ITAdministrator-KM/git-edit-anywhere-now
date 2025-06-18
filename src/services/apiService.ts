
import { API_CONFIG, buildApiUrl, DEFAULT_HEADERS } from '@/config/api.config';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  status?: string;
}

export interface PublicUser {
  id: number;
  public_id: string;
  username: string;
  name: string;
  email: string;
  nic: string;
  address: string;
  phone?: string;
  mobile?: string;
  status: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  qr_code?: string;
  qr_code_data?: string;
  qr_code_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'staff' | 'public';
  nic: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  status: string;
}

export interface Division {
  id: number;
  name: string;
  description?: string;
  department_id: number;
  status: string;
}

export interface ServiceCatalog {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  icon: string;
  fee_amount: number;
  processing_time_days: number;
  department_name: string;
  status: string;
  category: string;
  duration_minutes: number;
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
}

class ApiService {
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl(endpoint);
    const token = localStorage.getItem('authToken');
    
    const headers = {
      ...DEFAULT_HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log(`API Request: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const responseText = await response.text();
      console.log(`API Response [${response.status}]:`, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // Department APIs
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.makeRequest<ApiResponse<Department[]>>('/departments');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async createDepartment(departmentData: { name: string; description: string }): Promise<Department> {
    const response = await this.makeRequest<ApiResponse<Department>>('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
    return response.data!;
  }

  async updateDepartment(data: { id: number; name: string; description: string }): Promise<Department> {
    const response = await this.makeRequest<ApiResponse<Department>>('/departments', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteDepartment(id: number): Promise<any> {
    const response = await this.makeRequest('/departments', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Division APIs
  async getDivisions(): Promise<Division[]> {
    try {
      const response = await this.makeRequest<ApiResponse<Division[]>>('/divisions');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching divisions:', error);
      return [];
    }
  }

  async createDivision(divisionData: { name: string; department_id: number; description: string }): Promise<Division> {
    const response = await this.makeRequest<ApiResponse<Division>>('/divisions', {
      method: 'POST',
      body: JSON.stringify(divisionData),
    });
    return response.data!;
  }

  async updateDivision(data: { id: number; name: string; department_id: number; description: string }): Promise<Division> {
    const response = await this.makeRequest<ApiResponse<Division>>('/divisions', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteDivision(id: number): Promise<any> {
    const response = await this.makeRequest('/divisions', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Public Users APIs
  async getPublicUsers(): Promise<PublicUser[]> {
    try {
      const response = await this.makeRequest<ApiResponse<PublicUser[]>>('/public-users');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching public users:', error);
      return [];
    }
  }

  async createPublicUser(userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await this.makeRequest<ApiResponse<PublicUser>>('/public-users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create public user');
    }
    
    return response.data!;
  }

  async updatePublicUser(id: number, userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await this.makeRequest<ApiResponse<PublicUser>>('/public-users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response.data!;
  }

  async deletePublicUser(id: number): Promise<any> {
    const response = await this.makeRequest('/public-users', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Users APIs
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.makeRequest<ApiResponse<User[]>>('/users');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await this.makeRequest<ApiResponse<User>>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data!;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await this.makeRequest<ApiResponse<User>>('/users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response.data!;
  }

  async deleteUser(id: number): Promise<any> {
    const response = await this.makeRequest('/users', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Service APIs
  async getServices(): Promise<ServiceCatalog[]> {
    try {
      const response = await this.makeRequest<ApiResponse<ServiceCatalog[]>>('/services');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async getPublicServices(): Promise<ServiceCatalog[]> {
    return this.getServices();
  }

  async createService(serviceData: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    const response = await this.makeRequest<ApiResponse<ServiceCatalog>>('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    return response.data!;
  }

  async updateService(id: number, serviceData: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    const response = await this.makeRequest<ApiResponse<ServiceCatalog>>('/services', {
      method: 'PUT',
      body: JSON.stringify({ id, ...serviceData }),
    });
    return response.data!;
  }

  async deleteService(id: number): Promise<any> {
    const response = await this.makeRequest('/services', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Registry APIs
  async getRegistryEntries(date?: string, departmentId?: string, search?: string): Promise<RegistryEntry[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (departmentId) params.append('department_id', departmentId);
    if (search) params.append('search', search);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/registry?${queryString}` : '/registry';
    
    try {
      const response = await this.makeRequest<ApiResponse<RegistryEntry[]>>(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      return [];
    }
  }

  async createRegistryEntry(entryData: Partial<RegistryEntry>): Promise<{ id: number; registry_id: string }> {
    const response = await this.makeRequest<ApiResponse<{ id: number; registry_id: string }>>('/registry', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create registry entry');
    }
    
    return response.data!;
  }
}

export const apiService = new ApiService();
