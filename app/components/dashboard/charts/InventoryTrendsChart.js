// components/dashboard/charts/InventoryTrendsChart.js
'use client'
import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
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
  Alert
} from '@mui/material';
import { useTheme } from 'next-themes';
import { formatNumber, formatDate } from '@/lib/utils/formatting';

export default function InventoryTrendsChart() {
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
      const response = await fetch(`/api/dashboard/charts/inventory-trends?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;

    return (
      <Box
        sx={{
          bgcolor: isDark ? 'grey.900' : 'grey.50',
          border: 1,
          borderColor: isDark ? 'grey.800' : 'grey.200',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle2">
          {formatDate(label)}
        </Typography>
        {payload.map((item) => (
          <Box key={item.name} sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: item.color, display: 'flex', alignItems: 'center' }}
            >
              {item.name}: {formatNumber(item.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Inventory Trends"
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
        <Box sx={{ width: '100%', height: 400 }}>
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height={400} />
          ) : (
            <ResponsiveContainer>
              <LineChart
                data={data?.trends}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
                
                <Line
                  type="monotone"
                  dataKey="stockLevel"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  dot={false}
                  name="Stock Level"
                />
                <Line
                  type="monotone"
                  dataKey="inbound"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Inbound"
                />
                <Line
                  type="monotone"
                  dataKey="outbound"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                  name="Outbound"
                />
                
                {data?.reorderPoints?.map((point, index) => (
                  <ReferenceLine
                    key={index}
                    y={point.level}
                    stroke="#F59E0B"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Reorder Point',
                      fill: '#F59E0B',
                      fontSize: 12
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}