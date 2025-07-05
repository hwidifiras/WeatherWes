import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    borderWidth: {
      DEFAULT: '1px',
      '0': '0',
      '2': '2px',
      '4': '4px',
      '8': '8px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      
      // Use CSS variables for all colors
      primary: {
        50: 'var(--primary-50)',
        100: 'var(--primary-100)',
        200: 'var(--primary-200)',
        300: 'var(--primary-300)',
        400: 'var(--primary-400)',
        500: 'var(--primary-500)',
        600: 'var(--primary-600)',
        700: 'var(--primary-700)',
        800: 'var(--primary-800)',
        900: 'var(--primary-900)',
        950: 'var(--primary-950)',
      },
      secondary: {
        50: 'var(--secondary-50)',
        100: 'var(--secondary-100)',
        200: 'var(--secondary-200)',
        300: 'var(--secondary-300)',
        400: 'var(--secondary-400)',
        500: 'var(--secondary-500)',
        600: 'var(--secondary-600)',
        700: 'var(--secondary-700)',
        800: 'var(--secondary-800)',
        900: 'var(--secondary-900)',
        950: 'var(--secondary-950)',
      },
      gray: {
        50: 'var(--gray-50)',
        100: 'var(--gray-100)',
        200: 'var(--gray-200)',
        300: 'var(--gray-300)',
        400: 'var(--gray-400)',
        500: 'var(--gray-500)',
        600: 'var(--gray-600)',
        700: 'var(--gray-700)',
        800: 'var(--gray-800)',
        900: 'var(--gray-900)',
        950: 'var(--gray-950)',
      },
      error: {
        50: 'var(--error-50)',
        100: 'var(--error-100)',
        300: 'var(--error-300)',
        500: 'var(--error-500)',
        600: 'var(--error-600)',
        700: 'var(--error-700)',
      },
      warning: {
        50: 'var(--warning-50)',
        100: 'var(--warning-100)',
        300: 'var(--warning-300)',
        500: 'var(--warning-500)',
        600: 'var(--warning-600)',
        700: 'var(--warning-700)',
      },
      success: {
        50: 'var(--success-50)',
        100: 'var(--success-100)',
        300: 'var(--success-300)',
        500: 'var(--success-500)',
        600: 'var(--success-600)',
        700: 'var(--success-700)',
      },
      info: {
        50: 'var(--info-50)',
        100: 'var(--info-100)',
        300: 'var(--info-300)',
        500: 'var(--info-500)',
        600: 'var(--info-600)',
        700: 'var(--info-700)',
      },
      aqi: {
        good: 'var(--aqi-good)',
        moderate: 'var(--aqi-moderate)',
        'unhealthy-sensitive': 'var(--aqi-unhealthy-sensitive)',
        unhealthy: 'var(--aqi-unhealthy)',
        'very-unhealthy': 'var(--aqi-very-unhealthy)',
        hazardous: 'var(--aqi-hazardous)',
      },
    },
    fontSize: {
      'xs': '0.75rem',    // 12px
      'sm': '0.875rem',   // 14px
      'base': '1rem',     // 16px
      'lg': '1.125rem',   // 18px
      'xl': '1.25rem',    // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    fontWeight: {
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700',
    },
    lineHeight: {
      'none': '1',
      'tight': '1.25',
      'snug': '1.375',
      'normal': '1.5',
      'relaxed': '1.625',
      'loose': '2',
    },
    spacing: {
      '0': '0',
      '0.5': '0.125rem',  // 2px
      '1': '0.25rem',     // 4px
      '1.5': '0.375rem',  // 6px
      '2': '0.5rem',      // 8px
      '2.5': '0.625rem',  // 10px
      '3': '0.75rem',     // 12px
      '3.5': '0.875rem',  // 14px
      '4': '1rem',        // 16px
      '5': '1.25rem',     // 20px
      '6': '1.5rem',      // 24px
      '7': '1.75rem',     // 28px
      '8': '2rem',        // 32px
      '9': '2.25rem',     // 36px
      '10': '2.5rem',     // 40px
      '11': '2.75rem',    // 44px
      '12': '3rem',       // 48px
      '14': '3.5rem',     // 56px
      '16': '4rem',       // 64px
      '20': '5rem',       // 80px
      '24': '6rem',       // 96px
      '28': '7rem',       // 112px
      '32': '8rem',       // 128px
      '36': '9rem',       // 144px
      '40': '10rem',      // 160px
      '44': '11rem',      // 176px
      '48': '12rem',      // 192px
    },
    zIndex: {
      '0': '0',
      '10': '10',
      '20': '20',
      '30': '30',
      '40': '40',
      '50': '50',
      'dropdown': '1000',
      'sticky': '1020',
      'fixed': '1030',
      'modal-backdrop': '1040',
      'modal': '1050',
      'popover': '1060',
      'tooltip': '1070',
    },
    extend: {
      screens: {
        'xs': '475px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
    }
  },
  plugins: [],
});
