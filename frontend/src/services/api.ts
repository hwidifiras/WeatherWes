import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // You can add auth headers here if needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const customError = this.handleError(error);
        return Promise.reject(customError);
      }
    );
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          return new Error(data.detail || 'Invalid request');
        case 401:
          return new Error('Unauthorized - Please login');
        case 403:
          return new Error('Forbidden - You don\'t have permission');
        case 404:
          return new Error(data.detail || 'Resource not found');
        case 429:
          return new Error('Too many requests - Please try again later');
        case 500:
          return new Error('Server error - Please try again later');
        default:
          return new Error(data.detail || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'ECONNABORTED') {
        return new Error('Request timed out - Please try again');
      }
      return new Error('Network error - Please check your connection');
    }
    
    // Something else happened while setting up the request
    return new Error('An unexpected error occurred');
  }

  private normalizeError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('An unexpected error occurred');
  }

  // API methods
  async getLocations(city: string) {
    try {
      const response = await this.api.get(`/api/cities/${encodeURIComponent(city)}/locations`);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async getMeasurements(locationId: string) {
    try {
      const response = await this.api.get(`/api/measurements/${locationId}`);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async getFavorites() {
    try {
      const response = await this.api.get('/api/favorites');
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
