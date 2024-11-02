// components/dashboard/cards/InventoryHealthCard.js
import { Box, Typography, CircularProgress, Grid } from '@mui/material';
import { 
  BarChart as ChartIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import DashboardCard from './DashboardCard';
import { 
    ResponsiveContainer, 
    LineChart, 
    Line, 
    AreaChart, 
    Area,
  } from 'recharts';
  function MetricBox({ title, value, trend }) {
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
          gutterBottom
        >
          {title}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: getTrendColor()
          }}
        >
          {value}
        </Typography>
      </Box>
    );
  }
export default function InventoryHealthCard({ data, loading = false }) {
  const {
    turnoverRate,
    deadStockCount,
    valueTrend,
    accuracyRate
  } = data || {};

  const getHealthStatus = (rate) => {
    if (rate >= 90) return { color: '#10B981', icon: SuccessIcon, text: 'Excellent' };
    if (rate >= 70) return { color: '#F59E0B', icon: WarningIcon, text: 'Good' };
    return { color: '#EF4444', icon: ErrorIcon, text: 'Needs Attention' };
  };

  const health = getHealthStatus(accuracyRate);

  return (
    <DashboardCard
      title="Inventory Health"
      icon={ChartIcon}
      tooltipText="Overview of your inventory health metrics"
      gradient="linear-gradient(45deg, #6366F1, #8B5CF6)"
      delay={0.3}
    >
      <Grid container spacing={3}>
        {/* Accuracy Rate */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            height: 120
          }}>
            <CircularProgress
              variant="determinate"
              value={accuracyRate || 0}
              size={100}
              thickness={8}
              sx={{
                color: health.color,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {accuracyRate?.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Accuracy
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Metrics */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2
          }}>
            <MetricBox
              title="Turnover Rate"
              value={`${turnoverRate?.toFixed(1)}x`}
              trend={turnoverRate > 4 ? 'success' : 'warning'}
            />
            <MetricBox
              title="Dead Stock"
              value={deadStockCount}
              trend="error"
            />
          </Box>
        </Grid>

        {/* Value Trend */}
        <Grid item xs={12}>
          <Box sx={{ height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={valueTrend}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </DashboardCard>
  );
}

