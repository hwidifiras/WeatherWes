// Type guard for Axios error
function isAxiosError(error: any): error is {
  response?: {
    data?: any;
    status?: number;
  };
  message: string;
} {
  return error && error.isAxiosError === true;
}

export interface ApiError {
  message: string;
  code: string;
  status?: number;
  details?: unknown;
}

export class ApiRequestError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
    this.name = 'ApiRequestError';
  }
}

export function handleApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status,
      details: error.response?.data
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      details: error
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    details: error
  };
}

export async function apiRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    retryCount?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const { retryCount = 3, retryDelay = 1000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (isAxiosError(error) && error.response?.status && error.response.status < 500) {
        break;
      }

      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  throw new ApiRequestError(handleApiError(lastError));
}
