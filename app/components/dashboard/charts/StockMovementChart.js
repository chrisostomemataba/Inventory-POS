// components/dashboard/charts/StockMovementChart.js
'use client'
import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  Alert,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown 
} from '@mui/icons-material';
import { useTheme } from 'next-themes';
import { formatNumber, formatDate } from '@/lib/utils/formatting';

export default function StockMovementChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('week');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/charts/stock-movement?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;

    const inbound = payload.find(p => p.dataKey === 'inbound')?.value || 0;
    const outbound = payload.find(p => p.dataKey === 'outbound')?.value || 0;
    const netChange = inbound - outbound;

    return (
      <Box
        sx={{
          bgcolor: isDark ? 'grey.900' : 'grey.50',
          border: 1,
          borderColor: isDark ? 'grey.800' : 'grey.200',
          p: 2,
          borderRadius: 1,
          minWidth: 200
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {formatDate(label)}
        </Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#10B981">
              Inbound:
            </Typography>
            <Typography variant="body2">
              {formatNumber(inbound)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="#EF4444">
              Outbound:
            </Typography>
            <Typography variant="body2">
              {formatNumber(outbound)}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight="bold">
              Net Change:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {netChange > 0 ? (
                <TrendingUp color="success" fontSize="small" />
              ) : (
                <TrendingDown color="error" fontSize="small" />
              )}
              <Typography 
                variant="body2" 
                color={netChange > 0 ? 'success.main' : 'error.main'}
                fontWeight="bold"
              >
                {formatNumber(Math.abs(netChange))}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  };

  const SummaryStats = ({ data }) => {
    const totalInbound = data.reduce((sum, item) => sum + item.inbound, 0);
    const totalOutbound = data.reduce((sum, item) => sum + item.outbound, 0);
    const netChange = totalInbound - totalOutbound;

    return (
      <Stack 
        direction="row" 
        spacing={2} 
        sx={{ mb: 2 }}
        divider={<Divider orientation="vertical" flexItem />}
      >
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Inbound
          </Typography>
          <Typography variant="h6" color="success.main">
            {formatNumber(totalInbound)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Outbound
          </Typography>
          <Typography variant="h6" color="error.main">
            {formatNumber(totalOutbound)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Net Change
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {netChange > 0 ? (
              <TrendingUp color="success" />
            ) : (
              <TrendingDown color="error" />
            )}
            <Typography 
              variant="h6" 
              color={netChange > 0 ? 'success.main' : 'error.main'}
            >
              {formatNumber(Math.abs(netChange))}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Stock Movements"
        subheader="Track inbound and outbound inventory movements"
        action={
          <ToggleButtonGroup
            size="small"
            value={timeframe}
            exclusive
            onChange={(e, value) => value && setTimeframe(value)}
            aria-label="timeframe"
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="quarter">Quarter</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={400} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <SummaryStats data={data.movements} />
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={data.movements}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                  />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => formatDate(date, 'short')}
                    stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                  />
                  <YAxis 
                    stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="inbound" 
                    name="Inbound" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="outbound" 
                    name="Outbound" 
                    fill="#EF4444" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <ReferenceLine y={0} stroke="#666" />
                  <Brush 
                    dataKey="date" 
                    height={30} 
                    stroke="#8884d8"
                    fill={isDark ? '#2D3748' : '#F7FAFC'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}