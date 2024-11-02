// components/dashboard/cards/TotalProductsCard.js
import { Box, Typography, LinearProgress } from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import { formatNumber, formatCurrency } from '@/lib/utils/formatting';
import DashboardCard from './DashboardCard';
import StatBox from './StatBox';

export default function TotalProductsCard({ data, loading = false }) {
  const {
    totalActive,
    lowStock,
    outOfStock,
    totalValue
  } = data || {};

  const stockHealth = totalActive 
    ? ((totalActive - lowStock - outOfStock) / totalActive) * 100 
    : 0;

  return (
    <DashboardCard
      title="Product Overview"
      icon={InventoryIcon}
      tooltipText="Overview of your product inventory status"
      gradient="linear-gradient(45deg, #7C3AED, #9333EA)"
      delay={0.1}
    >
      <Box sx={{ position: 'relative' }}>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <LinearProgress />
          </Box>
        ) : (
          <>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                mb: 3
              }}
            >
              <StatBox
                title="Total Products"
                value={formatNumber(totalActive)}
                trend={null}
              />
              <StatBox
                title="Inventory Value"
                value={formatCurrency(totalValue)}
                trend={null}
              />
              <StatBox
                title="Low Stock"
                value={formatNumber(lowStock)}
                trend="warning"
              />
              <StatBox
                title="Out of Stock"
                value={formatNumber(outOfStock)}
                trend="error"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Stock Health
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stockHealth.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stockHealth}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(45deg, 
                      ${stockHealth > 70 ? '#10B981' : 
                        stockHealth > 30 ? '#F59E0B' : 
                        '#EF4444'
                      } 0%, 
                      ${stockHealth > 70 ? '#34D399' : 
                        stockHealth > 30 ? '#FBBF24' : 
                        '#F87171'
                      } 100%)`
                  }
                }}
              />
            </Box>
          </>
        )}
      </Box>
    </DashboardCard>
  );
}