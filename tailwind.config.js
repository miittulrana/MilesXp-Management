/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#004d99',
            light: '#336699',
            dark: '#003d80',
          },
          secondary: {
            DEFAULT: '#ff7700',
            light: '#ff9a44',
            dark: '#e56900',
          },
          success: {
            DEFAULT: '#28a745',
            light: '#48c664',
            dark: '#1e7e34',
          },
          warning: {
            DEFAULT: '#ffc107',
            light: '#ffce3a',
            dark: '#e0a800',
          },
          error: {
            DEFAULT: '#dc3545',
            light: '#e45c6b',
            dark: '#bd2130',
          },
          info: {
            DEFAULT: '#17a2b8',
            light: '#3ab7cc',
            dark: '#138496',
          },
          gray: {
            100: '#f8f9fa',
            200: '#e9ecef',
            300: '#dee2e6',
            400: '#ced4da',
            500: '#adb5bd',
            600: '#6c757d',
            700: '#495057',
            800: '#343a40',
            900: '#212529',
          },
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
        borderRadius: {
          sm: '0.25rem',
          DEFAULT: '0.375rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem',
          full: '9999px',
        },
        boxShadow: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        },
        transitionDuration: {
          fast: '150ms',
          DEFAULT: '250ms',
          slow: '350ms',
        },
        zIndex: {
          dropdown: '1000',
          sticky: '1020',
          fixed: '1030',
          'modal-backdrop': '1040',
          modal: '1050',
          popover: '1060',
          tooltip: '1070',
        },
      },
    },
    plugins: [],
  }