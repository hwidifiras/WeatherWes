// Backend model types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Country {
  id: number;
  code: string;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  city?: string;
  locality?: string;
  coordinates: Coordinates;
  country: Country;
  lastUpdated?: string;
  parameters?: any[];
  last_fetched?: string;
  measurement_count?: number;
  is_active?: boolean;
  is_demo_data?: boolean;
}

export interface Measurement {
  location: string;
  location_id: number | string;
  parameter: string;
  value: number;
  unit: string;
  date: string;
  last_fetched?: string;
  coordinates?: Coordinates;
  country?: Country;
  city?: string;
  is_demo?: boolean;
}

export interface MeasurementSummary {
  parameter: string;
  min_value: number;
  max_value: number;
  avg_value: number;
  count: number;
  unit: string;
  last_updated: string;
}

export interface LocationResponse {
  location: Location;
  measurements?: Measurement[];
  measurements_summary?: MeasurementSummary[];
}

// API types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  code?: string;
  status?: number;
}

// Filter types
export interface LocationFilter {
  city?: string;
  country?: string;
  parameters?: string[];
  hasRecent?: boolean;
  excludeUnknown?: boolean;
  limit?: number;
  page?: number;
  bbox?: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  };
}
