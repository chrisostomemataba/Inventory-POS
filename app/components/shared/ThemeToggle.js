// components/ThemeToggle.js
'use client'
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { IconButton, Tooltip } from '@mui/material';
import { WbSunny, DarkMode } from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Tooltip title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      <IconButton
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          },
        }}
        component={motion.button}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {theme === 'dark' ? (
          <WbSunny sx={{ color: '#FFD700' }} />
        ) : (
          <DarkMode sx={{ color: '#7C3AED' }} />
        )}
      </IconButton>
    </Tooltip>
  );
}