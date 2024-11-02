// components/layout/Navigation.js
'use client'
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useMediaQuery,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  Dashboard,
  Inventory2,
  PointOfSale,
  Analytics,
  Settings,
  People,
  ExpandLess,
  ExpandMore,
  ShoppingCart,
  LocalBar,
  Report,
  Category,
  AccountCircle,
  Notifications,
  LocalShipping,
  Receipt,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/app/components/shared/ThemeToggle';

const DRAWER_WIDTH = 280;

const menuItems = [
  {
    title: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    admin: true
  },
  {
    title: 'Inventory',
    icon: <Inventory2 />,
    submenu: [
      { title: 'Products', icon: <LocalBar />, path: '/inventory' },
      { title: 'Categories', icon: <Category />, path: '/inventory/categories' },
      { title: 'Suppliers', icon: <LocalShipping />, path: '/inventory/suppliers' }
    ]
  },
  {
    title: 'POS',
    icon: <PointOfSale />,
    path: '/pos'
  },
  {
    title: 'Sales',
    icon: <ShoppingCart />,
    submenu: [
      { title: 'Transactions', icon: <Receipt />, path: '/sales/transactions' },
      { title: 'Reports', icon: <Report />, path: '/sales/reports' }
    ]
  },
  {
    title: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
    admin: true
  },
  {
    title: 'Users',
    icon: <People />,
    path: '/users',
    admin: true
  },
  {
    title: 'Settings',
    icon: <Settings />,
    path: '/settings'
  }
];

export default function Navigation({ children }) {
  const [open, setOpen] = useState(true);
  const [openSubMenus, setOpenSubMenus] = useState({});
  const pathname = usePathname();
  const { theme } = useTheme();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const handleDrawer = () => {
    setOpen(!open);
  };

  const handleSubMenu = (title) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (path) => pathname === path;

  const Logo = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography
        variant="h5"
        component="h1"
        sx={{
          fontFamily: 'var(--font-playfair)',
          background: theme === 'dark' 
            ? 'linear-gradient(45deg, #9D65FF 30%, #b794f4 90%)'
            : 'linear-gradient(45deg, #7C3AED 30%, #9D65FF 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          letterSpacing: '0.02em'
        }}
      >
        Menu
      </Typography>
    </motion.div>
  );

  const MenuItem = ({ item, nested = false }) => {
    if (item.submenu) {
      return (
        <>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => handleSubMenu(item.title)}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                py: 1.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: openSubMenus[item.title] ? 'primary.main' : 'inherit'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                sx={{ 
                  opacity: open ? 1 : 0,
                  color: openSubMenus[item.title] ? 'primary.main' : 'inherit'
                }}
              />
              {open && (openSubMenus[item.title] ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={open && openSubMenus[item.title]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu.map((subItem) => (
                <MenuItem key={subItem.path} item={subItem} nested />
              ))}
            </List>
          </Collapse>
        </>
      );
    }

    return (
      <ListItem disablePadding sx={{ display: 'block' }}>
        <Link href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: nested ? 4 : 2.5,
              py: 1.5,
              bgcolor: isActive(item.path) ? 'primary.main' : 'transparent',
              '&:hover': {
                bgcolor: isActive(item.path) 
                  ? 'primary.dark'
                  : theme === 'dark' 
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.04)'
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
                color: isActive(item.path) ? 'common.white' : 'inherit'
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title}
              sx={{ 
                opacity: open ? 1 : 0,
                color: isActive(item.path) ? 'common.white' : 'inherit'
              }}
            />
          </ListItemButton>
        </Link>
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
    <AppBar
  position="fixed"
  sx={{
    width: { md: `calc(100% - ${open ? DRAWER_WIDTH : 64}px)` },
    ml: { md: `${open ? DRAWER_WIDTH : 64}px` },
    transition: theme => theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    bgcolor: theme === 'dark' ? 'background.paper' : 'common.white',
    borderBottom: 1,
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    boxShadow: 'none'
  }}
>
  <Toolbar>
    <IconButton
      color="inherit"
      aria-label="open drawer"
      onClick={handleDrawer}
      edge="start"
      sx={{
        marginRight: 2,
        // Show hamburger menu on all screen sizes
        display: 'block'
      }}
    >
      <MenuIcon />
    </IconButton>
    <Logo />
    <Box sx={{ flexGrow: 1 }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <ThemeToggle />
      <Tooltip title="Notifications">
        <IconButton color="inherit">
          <Badge badgeContent={4} color="primary">
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>
      <Tooltip title="Profile">
        <IconButton color="inherit">
          <AccountCircle />
        </IconButton>
      </Tooltip>
    </Box>
  </Toolbar>
</AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={isMobile ? handleDrawer : undefined}
        sx={{
          width: open ? DRAWER_WIDTH : 64,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            width: open ? DRAWER_WIDTH : 64,
            overflowX: 'hidden',
            bgcolor: theme === 'dark' ? 'background.paper' : 'common.white',
            borderRight: 1,
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          {open && <Logo />}
          <IconButton onClick={handleDrawer}>
            <ChevronLeft />
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <MenuItem key={item.title} item={item} />
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${open ? DRAWER_WIDTH : 64}px)` },
          ml: { md: `${open ? DRAWER_WIDTH : 64}px` },
          transition: theme => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          mt: 8
        }}
      >
        {children}
      </Box>
    </Box>
  );
}