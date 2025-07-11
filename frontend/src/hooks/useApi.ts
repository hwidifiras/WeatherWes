import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../chakra-components/toast/ToastProvider';
import type { Location, LocationResponse, LocationFilter } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UseApiOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiErrorResponse {
  status?: number;
  data?: {
    detail?: string;
    message?: string;
  };
}

export function useApi<T>(initialState: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialState,
    loading: false,
    error: null,
  });
  const toast = useToast();

  const handleError = useCallback((error: any) => {
    let errorMessage = 'An unexpected error occurred';

    if (error.isAxiosError) {
      if (!error.response) {
        errorMessage = 'Network error - Please check your connection';
      } else {
        const response = error.response as ApiErrorResponse;
        const status = response.status;
        const detail = response.data?.detail;

        switch (status) {
          case 400:
            errorMessage = detail || 'Invalid request';
            break;
          case 401:
            errorMessage = 'Unauthorized - Please login';
            break;
          case 403:
            errorMessage = 'Forbidden - You don\'t have permission';
            break;
          case 404:
            errorMessage = detail || 'Resource not found';
            break;
          case 429:
            errorMessage = 'Too many requests - Please try again later';
            break;
          case 500:
            errorMessage = 'Server error - Please try again later';
            break;
          default:
            errorMessage = detail || 'An unexpected error occurred';
        }
      }
    }

    setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    toast.error('Error', errorMessage);
  }, [toast]);

  const fetchData = useCallback(async (
    url: string,
    options: UseApiOptions = {}
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.get<T>(url);
      setState({
        data: response.data,
        loading: false,
        error: null,
      });

      if (options.showSuccessToast && options.successMessage) {
        toast.success('Success', options.successMessage);
      }

      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError, toast]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchData,
    clearError,
  };
}

// Custom hooks for specific API endpoints
export function useLocations() {
  const api = useApi<Location[]>();

  const searchLocations = useCallback(async (filter: LocationFilter) => {
    const params = new URLSearchParams();
    if (filter.city) params.append('city', filter.city);
    if (filter.country) params.append('country', filter.country);
    if (filter.parameters?.length) params.append('parameters', filter.parameters.join(','));
    if (filter.hasRecent !== undefined) params.append('has_recent', String(filter.hasRecent));
    if (filter.excludeUnknown !== undefined) params.append('exclude_unknown', String(filter.excludeUnknown));
    if (filter.limit) params.append('limit', String(filter.limit));
    if (filter.page) params.append('page', String(filter.page));

    return api.fetchData(`${API_BASE_URL}/api/locations?${params.toString()}`);
  }, [api]);

  return {
    ...api,
    searchLocations,
  };
}

export function useMeasurements() {
  const api = useApi<LocationResponse>();

  const getMeasurements = useCallback(async (locationId: string) => {
    return api.fetchData(`${API_BASE_URL}/api/measurements/${locationId}`);
  }, [api]);

  return {
    ...api,
    getMeasurements,
  };
}

export default {
  useLocations,
  useMeasurements,
};
