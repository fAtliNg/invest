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
import { AIChat } from '../../components/portfolios/details/chat/ai-chat';

const PortfolioAssistant = () => {
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
          Помощник | {portfolio?.title || 'Загрузка...'} | Profit Case
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: 'calc(100vh - 16px)',
          overflow: 'hidden',
          pt: 8,
          pb: 2
        }}
      >
        <Container maxWidth={false} sx={{ px: 3, height: '100%', overflow: 'hidden' }}>
          <Grid container spacing={3} sx={{ height: '100%', minHeight: 0 }}>
            <Grid item sx={{ display: 'flex' }}>
              <PortfolioSidebar />
            </Grid>
            <Grid item xs sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {isFetching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                  <Typography variant="h4" sx={{ mb: 3 }}>
                    Помощник
                  </Typography>
                  <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <AIChat portfolioName={portfolio?.title} uuid={uuid} />
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

PortfolioAssistant.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default PortfolioAssistant;
