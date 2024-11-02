// components/dashboard/charts/ProductPerformanceChart.js
'use client'
import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
  Label
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Stack,
  Chip
} from '@mui/material';
import { 
  TrendingUp, 
  ShowChart as ChartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { TrendingDown } from '@mui/icons-material';
import { useTheme } from 'next-themes';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils/formatting';

// Add this component inside the ProductPerformanceChart.js file, before the main component

const MetricCard = ({ title, value, subtitle, trend, trendLabel, icon: Icon, iconColor }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
  
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {Icon && (
            <Icon 
              color={iconColor} 
              sx={{ fontSize: '1.25rem' }} 
            />
          )}
          {trend !== undefined && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: trend > 0 ? 'success.main' : 'error.main'
              }}
            >
              {trend > 0 ? (
                <TrendingUp fontSize="small" />
              ) : (
                <TrendingDown fontSize="small" />
              )}
              <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                {formatPercentage(Math.abs(trend))}
              </Typography>
            </Box>
          )}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ flex: 1 }}
          >
            {subtitle}
          </Typography>
        </Box>
        {trendLabel && (
          <Typography variant="caption" color="text.secondary">
            {trendLabel}
          </Typography>
        )}
      </Box>
    );
  };

export default function ProductPerformanceChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [category, setCategory] = useState('all');
  const [metric, setMetric] = useState('revenue');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchData();
  }, [timeframe, category, metric]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/dashboard/charts/product-performance?timeframe=${timeframe}&category=${category}&metric=${metric}`
      );
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

    return (
      <Box
        sx={{
          bgcolor: isDark ? 'grey.900' : 'grey.50',
          border: 1,
          borderColor: isDark ? 'grey.800' : 'grey.200',
          p: 2,
          borderRadius: 1,
          minWidth: 250
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
        <Stack spacing={1.5}>
          {payload.map((entry) => (
            <Box 
              key={entry.name}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center' 
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: entry.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: entry.color 
                  }} 
                />
                {entry.name}:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {metric === 'revenue' 
                  ? formatCurrency(entry.value)
                  : metric === 'turnover'
                    ? `${entry.value.toFixed(2)}x`
                    : formatNumber(entry.value)
                }
              </Typography>
            </Box>
          ))}
        </Stack>
        {payload[0]?.payload?.insights && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              {payload[0].payload.insights}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const SummaryMetrics = ({ data }) => {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Average Velocity"
            value={formatNumber(data.averageVelocity)}
            subtitle="units per day"
            trend={data.velocityTrend}
            trendLabel={`${formatPercentage(Math.abs(data.velocityTrend))} vs last period`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Turnover Rate"
            value={`${data.turnoverRate.toFixed(2)}x`}
            subtitle="annual rate"
            trend={data.turnoverTrend}
            trendLabel={`${formatPercentage(Math.abs(data.turnoverTrend))} vs last period`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Performance Score"
            value={data.performanceScore}
            subtitle={data.performanceLabel}
            icon={data.performanceScore >= 70 ? CheckIcon : WarningIcon}
            iconColor={data.performanceScore >= 70 ? 'success' : 'warning'}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Product Performance"
        subheader="Track sales velocity and stock turnover"
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {data?.categories?.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ToggleButtonGroup
              size="small"
              value={metric}
              exclusive
              onChange={(e, value) => value && setMetric(value)}
            >
              <ToggleButton value="revenue">Revenue</ToggleButton>
              <ToggleButton value="turnover">Turnover</ToggleButton>
              <ToggleButton value="velocity">Velocity</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        }
      />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={500} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <SummaryMetrics data={data.summary} />
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={data.performance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                  />
                  <XAxis 
                    dataKey="name" 
                    scale="point" 
                    stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                    tickFormatter={value => 
                      metric === 'revenue' 
                        ? formatCurrency(value, 'compact')
                        : formatNumber(value)
                    }
                  >
                    <Label
                      value={
                        metric === 'revenue' 
                          ? 'Revenue' 
                          : metric === 'turnover'
                            ? 'Turnover Rate'
                            : 'Units/Day'
                      }
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#8884d8"
                  >
                    <Label
                      value="Performance Score"
                      angle={90}
                      position="insideRight"
                      style={{ textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey={metric}
                    name={
                      metric === 'revenue' 
                        ? 'Revenue' 
                        : metric === 'turnover'
                          ? 'Turnover Rate'
                          : 'Sales Velocity'
                    }
                    fill="#7C3AED"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="score"
                    name="Performance Score"
                    stroke="#8884d8"
                    dot={false}
                  />
                  <Scatter
                    yAxisId="left"
                    dataKey={metric}
                    fill="#7C3AED"
                    name="Threshold"
                    shape={({ cx, cy }) => (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        stroke="#7C3AED"
                        strokeWidth={2}
                        fill="transparent"
                      />
                    )}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Key Insights
              </Typography>
              {data.insights.map((insight, index) => (
                <Chip
                  key={index}
                  label={insight}
                  sx={{ mr: 1, mb: 1 }}
                  variant="outlined"
                  color={
                    insight.includes('increase') || insight.includes('high')
                      ? 'success'
                      : insight.includes('decrease') || insight.includes('low')
                        ? 'error'
                        : 'default'
                  }
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}