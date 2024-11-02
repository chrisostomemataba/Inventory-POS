// components/dashboard/charts/CategoryDistributionChart.js
'use client'
import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie,
  Cell,
  Sector,
  Legend,
  Tooltip
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
  useMediaQuery
} from '@mui/material';
import { useTheme } from 'next-themes';
import { formatCurrency, formatPercentage } from '@/lib/utils/formatting';

// Color palette for categories
const COLORS = [
  '#7C3AED', // Primary purple
  '#10B981', // Green
  '#F59E0B', // Orange
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Light purple
  '#14B8A6', // Teal
  '#F97316', // Dark orange
];

export default function CategoryDistributionChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewType, setViewType] = useState('value'); // 'value' or 'quantity'
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/charts/category-distribution');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render active shape for hover effect
  const renderActiveShape = (props) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, value, percent
    } = props;

    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill={isDark ? '#fff' : '#000'}
          style={{ fontSize: '16px', fontWeight: 'bold' }}
        >
          {payload.name}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill={isDark ? '#fff' : '#000'}
        >
          {viewType === 'value' 
            ? formatCurrency(value)
            : `${formatNumber(value)} items`
          }
        </text>
        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          fill={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'}
        >
          {formatPercentage(percent)}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0];
    return (
      <Box
        sx={{
          bgcolor: isDark ? 'grey.900' : 'grey.50',
          p: 1.5,
          border: 1,
          borderColor: isDark ? 'grey.800' : 'grey.200',
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {data.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {viewType === 'value' 
            ? formatCurrency(data.value)
            : `${formatNumber(data.value)} items`
          }
          {' '}({formatPercentage(data.payload.percent)})
        </Typography>
      </Box>
    );
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const chartData = data?.[viewType === 'value' ? 'valueDistribution' : 'quantityDistribution'];

  return (
    <Card>
      <CardHeader
        title="Category Distribution"
        action={
          <ToggleButtonGroup
            size="small"
            value={viewType}
            exclusive
            onChange={(e, value) => value && setViewType(value)}
            aria-label="view type"
          >
            <ToggleButton value="value">Value</ToggleButton>
            <ToggleButton value="quantity">Quantity</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        <Box sx={{ width: '100%', height: 400 }}>
          {loading ? (
            <Skeleton variant="circular" width="100%" height={400} />
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 60 : 80}
                  outerRadius={isMobile ? 80 : 100}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(0)}
                >
                  {chartData?.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout={isMobile ? 'horizontal' : 'vertical'}
                  align={isMobile ? 'center' : 'right'}
                  verticalAlign={isMobile ? 'bottom' : 'middle'}
                  formatter={(value, entry) => (
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: isDark ? 'grey.300' : 'grey.700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      {value}
                    </Typography>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}