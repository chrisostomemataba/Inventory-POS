// app/components/providers/ThemeProvider.js
'use client'
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useTheme } from 'next-themes';

export default function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <NextThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      themes={['light', 'dark']}
    >
      <MUIWrapper>{children}</MUIWrapper>
    </NextThemeProvider>
  );
}

function MUIWrapper({ children }) {
  const { theme = 'light' } = useTheme();
  const muiTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}