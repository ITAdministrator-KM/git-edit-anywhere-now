import { API_CONFIG, DEFAULT_HEADERS } from '../config/api.config';

export class ApiBase {
  private baseURL = API_CONFIG.BASE_URL;
  private maxRetries = API_CONFIG.MAX_RETRIES;
  private timeout = API_CONFIG.TIMEOUT;

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    return this.makeRequestWithRetry(endpoint, options, 0);
  }

  private async makeRequestWithRetry(endpoint: string, options: RequestInit, retryCount: number): Promise<any> {
    // Normalize endpoint (remove leading/trailing slashes)
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    const url = `${this.baseURL}/${cleanEndpoint}`;
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Create headers from default headers and merge with any provided headers
      const headers = new Headers(DEFAULT_HEADERS);
      
      // Add any custom headers from options
      if (options.headers) {
        const customHeaders = new Headers(options.headers);
        customHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
      }
      
      // Add authorization header if token exists and not already set
      if (authToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }
      
      // Log request for debugging
      if (import.meta.env.DEV) {
        console.debug(`[API] ${options.method || 'GET'} ${url}`, {
          headers: Object.fromEntries(headers.entries()),
          body: options.body ? JSON.parse(options.body as string) : undefined
        });
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Log detailed error information for debugging
        console.error(`API Error [${response.status}]: ${url}`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorText,
          requestHeaders: Object.fromEntries(headers.entries())
        });
        
        // Handle specific HTTP status codes
        if (response.status === 401) {
          console.log('Authentication failed, clearing auth data');
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (response.status === 404) {
          throw new Error('The requested resource was not found. Please try again later.');
        }
        
        if (response.status === 406) {
          // Try to parse error response if it's JSON
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'The request was not acceptable. Please try again.');
          } catch (e) {
            throw new Error('The server cannot produce a response matching the list of acceptable values.');
          }
        }
        
        if (response.status >= 500) {
          throw new Error('A server error occurred. Our team has been notified. Please try again later.');
        }
        
        // For other errors, try to extract a meaningful message
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the raw text
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (retryCount < this.maxRetries) {
          console.log(`Request timed out, retrying (${retryCount + 1}/${this.maxRetries})`);
          return this.makeRequestWithRetry(endpoint, options, retryCount + 1);
        }
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      throw error;
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
