
import { PrismaClient } from '@prisma/client';
// components/dashboard/cards/SalesOverviewCard.js
import { Box, Typography, Divider, Chip, Tooltip } from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown,
  MonetizationOn as SalesIcon,
} from '@mui/icons-material';

import { formatCurrency, formatPercentage } from '@/lib/utils/formatting';
import { useTheme } from 'next-themes';
import { Area } from 'recharts';
import DashboardCard from './DashboardCard';
import { 
    ResponsiveContainer, 
    AreaChart, 
  } from 'recharts';

export default function SalesOverviewCard({ data, loading = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    todaySales,
    weeklyComparison,
    monthlyGrowth,
    averageTransaction,
    salesTrend
  } = data || {};

  const getTrendColor = (value) => {
    if (value > 0) return '#10B981';
    if (value < 0) return '#EF4444';
    return '#6B7280';
  };

  const TrendIndicator = ({ value }) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 0.5,
      color: getTrendColor(value)
    }}>
      {value > 0 ? <TrendingUp /> : <TrendingDown />}
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {formatPercentage(Math.abs(value))}
      </Typography>
    </Box>
  );

  return (
    <DashboardCard
      title="Sales Overview"
      icon={SalesIcon}
      tooltipText="Overview of your sales performance"
      gradient="linear-gradient(45deg, #10B981, #34D399)"
      delay={0.2}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Today's Sales */}
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {formatCurrency(todaySales?.total || 0)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label="Today's Sales" 
              size="small"
              sx={{ 
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                color: '#10B981'
              }}
            />
            <TrendIndicator value={todaySales?.trend || 0} />
          </Box>
        </Box>

        <Divider />

        {/* Comparison Metrics */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
          gap: 2 
        }}>
          <Box>
            <Typography color="text.secondary" variant="body2">
              Weekly
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="h6">
                {formatCurrency(weeklyComparison?.total || 0)}
              </Typography>
              <TrendIndicator value={weeklyComparison?.trend || 0} />
            </Box>
          </Box>

          <Box>
            <Typography color="text.secondary" variant="body2">
              Monthly Growth
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="h6">
                {formatPercentage(monthlyGrowth?.rate || 0)}
              </Typography>
              <TrendIndicator value={monthlyGrowth?.trend || 0} />
            </Box>
          </Box>

          <Box>
            <Typography color="text.secondary" variant="body2">
              Avg. Transaction
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
              {formatCurrency(averageTransaction || 0)}
            </Typography>
          </Box>
        </Box>

        {/* Sales Trend Chart */}
        {salesTrend && (
          <Box sx={{ mt: 2, height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="0%" 
                      stopColor={isDark ? '#10B981' : '#34D399'} 
                      stopOpacity={0.5}
                    />
                    <stop 
                      offset="100%" 
                      stopColor={isDark ? '#10B981' : '#34D399'} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </DashboardCard>
  );
}