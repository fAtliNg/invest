import { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DashboardNavbar } from './dashboard-navbar';
import { DashboardSidebar } from './dashboard-sidebar';
import { useAuthContext } from '../contexts/auth-context';

const DashboardLayoutRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  maxWidth: '100%',
  paddingTop: 16,
  [theme.breakpoints.up('lg')]: {
    paddingLeft: 280
  }
}));

export const DashboardLayout = (props) => {
  const { children, controls } = props;
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuthContext();
  const [welcomeNotification, setWelcomeNotification] = useState({
    open: false,
    message: ''
  });

  useEffect(() => {
    const loginSuccess = localStorage.getItem('loginSuccess');
    if (loginSuccess && user) {
      setWelcomeNotification({
        open: true,
        message: `Добро пожаловать, ${user.firstName || 'Пользователь'}!`
      });
      localStorage.removeItem('loginSuccess');
    }
  }, [user]);

  const handleCloseWelcome = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setWelcomeNotification({ ...welcomeNotification, open: false });
  };

  return (
    <>
      <DashboardLayoutRoot>
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          {children}
        </Box>
      </DashboardLayoutRoot>
      <DashboardNavbar
        onSidebarOpen={() => setSidebarOpen(true)}
        controls={controls}
      />
      <DashboardSidebar
        onClose={() => setSidebarOpen(false)}
        open={isSidebarOpen}
      />
      <Snackbar
        open={welcomeNotification.open}
        autoHideDuration={6000}
        onClose={handleCloseWelcome}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseWelcome}
          severity="success"
          sx={{ width: '100%' }}
        >
          {welcomeNotification.message}
        </Alert>
      </Snackbar>
    </>
  );
};
