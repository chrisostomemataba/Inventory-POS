// lib/theme.js
import { createTheme } from '@mui/material/styles';
import { themeSettings } from './settings';

export const lightTheme = createTheme({
    ...themeSettings,
  palette: {
    mode: 'light',
    primary: {
      main: '#7C3AED',
      light: '#9D65FF',
      dark: '#6023DD',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F9FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1B1E',
      secondary: '#4B5563',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h1: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});