import { Box, CircularProgress } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';

const Quotes = () => (
  <DashboardLayout>
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '500px' }}>
      <CircularProgress />
    </Box>
  </DashboardLayout>
);

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/quotes/share',
      permanent: true
    }
  };
}

export default Quotes;
