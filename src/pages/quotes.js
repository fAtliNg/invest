import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';

const Quotes = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quotes/share');
  }, [router]);

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '500px' }}>
        <CircularProgress />
      </Box>
    </DashboardLayout>
  );
};

export default Quotes;
