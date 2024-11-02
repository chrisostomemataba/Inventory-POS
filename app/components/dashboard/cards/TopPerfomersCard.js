// components/dashboard/cards/TopPerformersCard.js
import { Box, Typography, List, ListItem, ListItemText, Avatar } from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import DashboardCard from './DashboardCard';

export default function TopPerformersCard({ data, loading = false }) {
  const {
    bestSelling,
    mostProfitable,
    fastMoving,
    slowMoving
  } = data || {};

  const renderProductList = (products, type) => (
    <List dense>
      {products?.map((product, index) => (
        <ListItem
          key={product.id}
          sx={{
            borderRadius: 1,
            mb: 1,
            bgcolor: theme => 
              theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.02)',
            '&:hover': {
              bgcolor: theme =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)',
            }
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              mr: 2,
              bgcolor: index === 0 ? 'primary.main' : 'grey.500',
              fontSize: '0.875rem'
            }}
          >
            #{index + 1}
          </Avatar>
          <ListItemText
            primary={product.name}
            secondary={
              type === 'bestselling' 
                ? `${product.soldCount} units sold`
                : type === 'profitable'
                ? formatCurrency(product.profit)
                : type === 'fast'
                ? `${product.turnoverRate}x turnover`
                : `${product.daysInStock} days in stock`
            }
          />
          {type !== 'slow' && (
            <Typography
              variant="body2"
              color="success.main"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <ArrowUpward fontSize="small" />
              {formatPercentage(product.growth)}
            </Typography>
          )}
        </ListItem>
      ))}
    </List>
  );

  return (
    <DashboardCard
      title="Top Performers"
      icon={TrophyIcon}
      tooltipText="Overview of your best and worst performing products"
      gradient="linear-gradient(45deg, #F59E0B, #FBBF24)"
      delay={0.4}
    >
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3
      }}>
        <Box>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Best Selling Products
          </Typography>
          {renderProductList(bestSelling, 'bestselling')}
          
          <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }} gutterBottom>
            Most Profitable
          </Typography>
          {renderProductList(mostProfitable, 'profitable')}
        </Box>
        
        <Box>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            Fast Moving Items
          </Typography>
          {renderProductList(fastMoving, 'fast')}
          
          <Typography variant="subtitle2" color="error.main" sx={{ mt: 2 }} gutterBottom>
            Slow Moving Items
          </Typography>
          {renderProductList(slowMoving, 'slow')}
        </Box>
      </Box>
    </DashboardCard>
  );
}