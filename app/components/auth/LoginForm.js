// app/page.js
'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/app/context/LoadingContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Container
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  WineBar
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { FadeIn } from '@/app/components/animations/FadeIn';
import ThemeToggle from '@/app/components/shared/ThemeToggle';
import styles from '../../styles/Login.module.css';

export default function LoginForm() {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { isLoading, startLoading, stopLoading } = useLoading();  
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      
      startLoading(['Authenticating', 'Checking Credentials', 'Loading Profile', 'Preparing System', 'Almost Done']);
  
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }
  
        // Add a slight delay for better UX
        setTimeout(() => {
          stopLoading();
          router.push(data.user.role === 'admin' ? '/dashboard' : '/pos');
        }, 1500);
  
      } catch (error) {
        stopLoading();
        setError(error.message);
      }
    };
  
  return (
    <Container maxWidth={false} className={styles.loginContainer}>
      <ThemeToggle />
      
      <Box className={styles.loginWrapper}>
        <Paper elevation={3} className={styles.loginForm}>
          <FadeIn>
            <Box className={styles.logoSection}>
              <motion.div
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <WineBar sx={{ fontSize: 40, color: 'primary.main' }} />
              </motion.div>
              <Typography
                variant="h4"
                component="h1"
                className={styles.title}
                sx={{ fontFamily: 'var(--font-playfair)' }}
              >
                Winehouse
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                className={styles.subtitle}
              >
                Inventory Management System
              </Typography>
            </Box>

            {error && (
              <FadeIn delay={0.1}>
                <Alert severity="error" className={styles.alert}>
                  {error}
                </Alert>
              </FadeIn>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <FadeIn delay={0.2}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  className={styles.textField}
                />
              </FadeIn>

              <FadeIn delay={0.3}>
                <TextField
                  fullWidth
                  label="Password"
                  variant="outlined"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  className={styles.textField}
                />
              </FadeIn>

              <FadeIn delay={0.4}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  className={styles.submitButton}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </FadeIn>
            </form>
          </FadeIn>
        </Paper>
      </Box>
    </Container>
  );
}