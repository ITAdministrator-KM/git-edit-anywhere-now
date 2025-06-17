import { ApiBase } from './apiBase';

export type UserRole = 'admin' | 'staff' | 'public';

export interface NotificationData {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
}

// Add alias for backward compatibility
export interface Notification extends NotificationData {}

export interface Token {
  id: number;
  token_number: number;
  department_id: number;
  division_id: number;
  department_name?: string;
  division_name?: string;
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface LoginResponseData {
  user: User;
  token: string;
  expires_at: number;
}

export interface LoginResponse {
  status: 'success' | 'error';
  message: string;
  data?: LoginResponseData;
}

export interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  phone?: string;
  department_id: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PublicUserPasswordUpdate {
  id: number;
  currentPassword?: string;
  newPassword: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: UserRole;
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
  description: string;
  status: string;
  created_at: string;
}

export interface Division {
  id: number;
  name: string;
  department_id: number;
  department_name?: string;
  description: string;
  status: string;
  created_at: string;
}

export interface NotificationMeta {
  total: number;
  unread: number;
  limit: number;
  offset: number;
}

export interface NotificationsResponse {
  status: 'success' | 'error';
  message: string;
  data: NotificationData[];
  meta: NotificationMeta;
}

export interface QRScanData {
  public_user_id: number;
  staff_user_id: number;
  scan_purpose: string;
  scan_location: string;
  scan_data?: string;
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
  updated_at?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

type CustomRequestInit = RequestInit & {
  timeout?: number;
  retry?: boolean;
  maxRetries?: number;
};

interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
  maxRetries?: number;
}

class ApiService extends ApiBase {
  private static readonly baseURL = 'https://dskalmunai.lk/backend/api';
  protected async makeRequest(endpoint: string, options: CustomRequestInit = {}): Promise<any> {
    const { timeout = 30000, retry = false, maxRetries = 3, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(ApiService.baseURL + endpoint, {
        ...fetchOptions,
        signal: controller.signal
      });
      // ...rest of the method
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Auth
  async login(data: { username: string; password: string; role: string }): Promise<LoginResponse> {
    const response = await this.makeRequest('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async updatePassword(data: { id: number; currentPassword: string; newPassword: string }): Promise<any> {
    const response = await this.makeRequest('/users/password.php', {
      method: 'PUT',
      body: JSON.stringify({ 
        id: data.id,
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      }),
    });
    return response;
  }

  // Public Users
  async getPublicUsers(): Promise<PublicUser[]> {
    const response = await this.makeRequest('/public-users/');
    return Array.isArray(response.data) ? response.data : [];
  }

  async getPublicUserById(id: number): Promise<PublicUser> {
    const response = await this.makeRequest(`/public-users/?id=${id}`);
    return response.data;
  }

  async createPublicUser(userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updatePublicUser(id: number, userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response.data;
  }

  async deletePublicUser(id: number): Promise<any> {
    const response = await this.makeRequest('/public-users/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  async updatePublicUserPassword(data: PublicUserPasswordUpdate): Promise<any> {
    const response = await this.makeRequest('/public-users/password.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.makeRequest('/users/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Failed to fetch users. Please try again.');
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const response = await this.makeRequest('/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user. Please check your input and try again.');
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await this.makeRequest('/users/', {
        method: 'PUT',
        body: JSON.stringify({ id, ...userData }),
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Failed to update user. Please try again.');
    }
  }

  async deleteUser(id: number): Promise<any> {
    try {
      const response = await this.makeRequest('/users/', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error('Failed to delete user. Please try again.');
    }
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    const response = await this.makeRequest('/departments/');
    return Array.isArray(response.data) ? response.data : [];
  }

  async createDepartment(departmentData: { name: string; description: string }): Promise<Department> {
    const response = await this.makeRequest('/departments/', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
    return response.data;
  }

  async updateDepartment(data: { id: number; name: string; description: string }): Promise<Department> {
    const response = await this.makeRequest('/departments/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteDepartment(id: number): Promise<any> {
    const response = await this.makeRequest('/departments/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Divisions
  async getDivisions(departmentId?: number): Promise<Division[]> {
    try {
      const endpoint = departmentId ? `/divisions/?department_id=${departmentId}` : '/divisions/';
      const response = await this.makeRequest(endpoint);
      return Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
      throw new Error('Failed to fetch divisions. Please try again.');
    }
  }

  async createDivision(divisionData: { name: string; department_id: number; description: string }): Promise<Division> {
    try {
      const response = await this.makeRequest('/divisions/', {
        method: 'POST',
        body: JSON.stringify(divisionData),
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to create division:', error);
      throw new Error('Failed to create division. Please check your input and try again.');
    }
  }

  async updateDivision(data: { id: number; name: string; department_id: number; description: string }): Promise<Division> {
    try {
      const response = await this.makeRequest('/divisions/', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to update division:', error);
      throw new Error('Failed to update division. Please try again.');
    }
  }

  async deleteDivision(id: number): Promise<any> {
    try {
      const response = await this.makeRequest(`/divisions/?id=${id}`, {
        method: 'DELETE',
      });
      return response.data || response;
    } catch (error) {
      console.error('Failed to delete division:', error);
      throw new Error('Failed to delete division. Please try again.');
    }
  }

  // Tokens
  async createToken(tokenData: { department_id: number; division_id: number }): Promise<Token> {
    const response = await this.makeRequest('/tokens/', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
    
    // Handle both response formats:
    // 1. Direct token object: { token_number: 123, ... }
    // 2. Wrapped in data property: { data: { token_number: 123, ... } }
    if (response && response.data) {
      return response.data;
    }
    return response;
  }

  async getTokens(departmentId?: number): Promise<Token[]> {
    const endpoint = departmentId ? `/tokens/?department_id=${departmentId}` : '/tokens/';
    const response = await this.makeRequest(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  }

  async updateTokenStatus(tokenId: number, status: Token['status']): Promise<Token> {
    const response = await this.makeRequest('/tokens/', {
      method: 'PUT',
      body: JSON.stringify({ id: tokenId, status }),
    });
    return response.data;
  }

  // Add alias for backward compatibility
  async updateToken(data: { id: number; status: Token['status'] }): Promise<Token> {
    return this.updateTokenStatus(data.id, data.status);
  }

  // Service History
  async getServiceHistory(publicUserId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    department_id?: number;
    from_date?: string;
    to_date?: string;
  }): Promise<{ data: any[]; meta: any }> {
    const queryParams = new URLSearchParams({
      public_user_id: publicUserId,
      ...(params?.page && { page: params.page.toString() }),
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.status && { status: params.status }),
      ...(params?.department_id && { department_id: params.department_id.toString() }),
      ...(params?.from_date && { from_date: params.from_date }),
      ...(params?.to_date && { to_date: params.to_date }),
    });

    const response = await this.makeRequest(`/service-history/?${queryParams}`);
    return response;
  }

  async addServiceHistory(data: {
    public_user_id: string;
    department_id: number;
    division_id: number;
    service_name: string;
    details?: string;
    staff_user_id?: number;
  }): Promise<any> {
    const response = await this.makeRequest('/service-history/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateServiceHistory(data: {
    id: number;
    status: string;
    details?: string;
  }): Promise<any> {
    const response = await this.makeRequest('/service-history/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<NotificationsResponse> {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      let endpoint = `/notifications/index.php?recipient_id=${userId}`;
      
      // Map admin role to staff for backend compatibility
      const recipientType = userRole === 'admin' ? 'staff' : userRole;
      if (recipientType) {
        endpoint += `&recipient_type=${recipientType}`;
      }
      
      const response = await this.makeRequest(endpoint);
      return response as NotificationsResponse;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        status: 'error',
        message: 'Failed to fetch notifications',
        data: [],
        meta: { total: 0, unread: 0, limit: 0, offset: 0 }
      };
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<{ status: string; message: string }> {
    const response = await this.makeRequest('/notifications/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: notificationId, is_read: true }),
    });
    return response;
  }

  // QR Scans
  async recordQRScan(data: QRScanData): Promise<any> {
    const response = await this.makeRequest('/qr-scans/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  // Registry Management
  async getRegistryEntries(date?: string): Promise<RegistryEntry[]> {
    try {
      const query = date ? `?date=${date}` : '';
      const response = await this.makeRequest(`/registry/${query}`);
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch registry entries:', error);
      return [];
    }
  }

  async createRegistryEntry(entryData: any): Promise<RegistryEntry> {
    const response = await this.makeRequest('/registry/', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return response?.data || response;
  }

  async updateRegistryEntry(id: number, entryData: any): Promise<RegistryEntry> {
    const response = await this.makeRequest('/registry/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...entryData }),
    });
    return response?.data || response;
  }

  async deleteRegistryEntry(id: number): Promise<void> {
    await this.makeRequest('/registry/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Service Catalog
  async getServices(): Promise<Service[]> {
    try {
      const response = await this.makeRequest('/service-catalog/', {
        timeout: 10000,
        retry: true,
        maxRetries: 3
      });
      
      if (!response || !Array.isArray(response?.data)) {
        throw new Error('Invalid response format');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to fetch services:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
