import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import CalculateIcon from '@mui/icons-material/Calculate';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';

export const Navbar = ({ actions }) => {
  const location = useLocation();
  
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        py: 2,
        px: 3,
        mb: 4,
        boxShadow: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box display="flex" flexDirection="column">
         <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="h5" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
              🌾 MRS Paddy Calculator
            </Typography>
         </Link>
         <Typography variant="caption" sx={{ opacity: 0.8, whiteSpace: 'nowrap' }}>Developed by - Sunil MG</Typography>
      </Box>

      <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
        {/* Navigation Links */}
         <Button 
            color="inherit" 
            component={Link} 
            to="/"
            startIcon={<CalculateIcon />}
            sx={{ 
                bgcolor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: location.pathname === '/' ? 'bold' : 'normal',
                display: { xs: 'none', sm: 'flex' }
            }}
         >
            Calculator
         </Button>
         <Button 
            color="inherit" 
            component={Link} 
            to="/records"
            startIcon={<HistoryIcon />}
             sx={{ 
                bgcolor: location.pathname === '/records' ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: location.pathname === '/records' ? 'bold' : 'normal',
                display: { xs: 'none', sm: 'flex' }
            }}
         >
            Records
         </Button>
         <Button 
            color="inherit" 
            component={Link} 
            to="/dashboard"
            startIcon={<DashboardIcon />}
             sx={{ 
                bgcolor: location.pathname === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: location.pathname === '/dashboard' ? 'bold' : 'normal',
                display: { xs: 'none', sm: 'flex' }
            }}
         >
            Dashboard
         </Button>
         
         {/* Page Specific Actions */}
         {actions}
      </Box>
    </Box>
  );
};
