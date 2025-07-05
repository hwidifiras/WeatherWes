// tailwind-theme.js
// Modern color palette for WeatherWeS application

export const colors = {
  // Primary brand colors
  primary: {
    50: '#EBF5FF',
    100: '#E1EFFE',
    200: '#C3DDFD',
    300: '#A4CAFE',
    400: '#76A9FA',
    500: '#3F83F8',
    600: '#1C64F2',
    700: '#1A56DB',
    800: '#1E429F',
    900: '#233876',
    950: '#172554',
  },
  
  // Secondary complementary colors
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052e16',
  },
  
  // Neutral grays
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  
  // Accent colors
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  
  // Semantic colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    300: '#FCA5A5',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    300: '#FCD34D',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    300: '#6EE7B7',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    300: '#93C5FD',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  
  // AQI specific colors
  aqi: {
    good: '#4ADE80',            // Green
    moderate: '#FBBF24',        // Yellow
    unhealthySensitive: '#FB923C', // Orange
    unhealthy: '#EF4444',       // Red
    veryUnhealthy: '#A855F7',   // Purple
    hazardous: '#94171A',       // Maroon
  }
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.45)',
  'focus-success': '0 0 0 3px rgba(16, 185, 129, 0.45)',
  'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.45)',
  none: 'none',
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

export const fontFamily = {
  sans: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  heading: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
};
