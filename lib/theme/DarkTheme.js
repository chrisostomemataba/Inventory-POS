import { createTheme } from '@mui/material/styles';
import { themeSettings } from './settings';

export const darkTheme = createTheme({
  ...themeSettings,
    palette: {
      mode: 'dark',
      primary: {
        main: '#9D65FF',
        light: '#B794FF',
        dark: '#7C3AED',
        contrastText: '#FFFFFF',
      },
      background: {
        default: '#1A1B1E',
        paper: '#2A2B2F',
      },
      text: {
        primary: '#F8F9FC',
        secondary: '#9CA3AF',
      },
    },
  });