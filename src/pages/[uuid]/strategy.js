import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button,
  Grid
} from '@mui/material';
import { DashboardLayout } from '../../components/dashboard-layout';
import { useAuthContext } from '../../contexts/auth-context';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { PortfolioSidebar } from '../../components/portfolios/details/portfolio-sidebar';

const PortfolioStrategy = () => {
  const router = useRouter();
  const { uuid } = router.query;
  const { isAuthenticated, isLoading } = useAuthContext();
  const [portfolio, setPortfolio] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!uuid) return;
      
      try {
        const response = await axios.get(`/api/portfolios/${uuid}`);
        setPortfolio(response.data);
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setError(err.response?.data?.error || 'Произошла ошибка при загрузке портфеля');
      } finally {
        setIsFetching(false);
      }
    };

    if (isAuthenticated && uuid) {
      fetchPortfolio();
    }
  }, [isAuthenticated, uuid]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          Стратегия | {portfolio?.title || 'Загрузка...'} | Profit Case
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth={false} sx={{ px: 3 }}>
          <Grid container spacing={3}>
            <Grid item>
              <PortfolioSidebar />
            </Grid>
            <Grid item xs>
              {isFetching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <>
                  <Typography variant="h4" sx={{ mb: 3 }}>
                    Стратегия портфеля
                  </Typography>
                  <Typography variant="body1">
                    Здесь будет информация о стратегии портфеля «{portfolio?.title}».
                  </Typography>
                </>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

PortfolioStrategy.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default PortfolioStrategy;
