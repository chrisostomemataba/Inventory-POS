// components/dashboard/cards/StatBox.js
import { Box, Typography } from '@mui/material';
// Helper component for consistent stat display
function StatBox({ title, value, trend }) {
    const getTrendColor = () => {
      switch (trend) {
        case 'success': return 'success.main';
        case 'warning': return 'warning.main';
        case 'error': return 'error.main';
        default: return 'text.primary';
      }
    };
  
    return (
      <Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            color: trend ? getTrendColor() : 'inherit'
          }}
        >
          {value}
        </Typography>
      </Box>
    );
  }