// components/dashboard/cards/DashboardCard.js
// This is a base card component that others will extend
import { Card, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { Info as InfoIcon } from '@mui/icons-material';
import { useTheme } from 'next-themes';

export default function DashboardCard({ 
  title, 
  subtitle,
  icon: Icon,
  children,
  tooltipText,
  gradient,
  delay = 0 
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Card
        elevation={0}
        sx={{
          height: '100%',
          background: isDark 
            ? 'linear-gradient(145deg, rgba(49,49,49,0.7) 0%, rgba(33,33,33,0.7) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDark 
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(0,0,0,0.1)'
          }
        }}
      >
        {gradient && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: gradient
            }}
          />
        )}
        
        <Box sx={{ p: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {Icon && (
                <Icon 
                  sx={{ 
                    color: 'primary.main',
                    fontSize: '1.5rem'
                  }} 
                />
              )}
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: isDark ? 'grey.100' : 'grey.800'
                }}
              >
                {title}
              </Typography>
            </Box>
            {tooltipText && (
              <Tooltip title={tooltipText} arrow placement="top">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 2 }}
            >
              {subtitle}
            </Typography>
          )}

          {children}
        </Box>
      </Card>
    </motion.div>
  );
}



