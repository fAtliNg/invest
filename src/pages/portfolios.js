import Head from 'next/head';
import { Box, Container, Typography, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { PortfolioCard } from '../components/portfolios/portfolio-card';
import { useAuthContext } from '../contexts/auth-context';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { ROUTES } from '../constants';
import axios from 'axios';

const Portfolios = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [portfolios, setPortfolios] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await axios.get('/api/portfolios');
        setPortfolios(response.data);
      } catch (err) {
        console.error('Failed to fetch portfolios:', err);
      } finally {
        setIsFetching(false);
      }
    };

    if (isAuthenticated) {
      fetchPortfolios();
    }
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          Портфели | Profit Case
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="lg">
          <Typography
            sx={{ mb: 3 }}
            variant="h4"
          >
            Портфели
          </Typography>
          
          {isFetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid
              container
              spacing={3}
            >
              <Grid
                item
                lg={4}
                md={6}
                xs={12}
              >
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: 2,
                    border: '2px dashed #E5E7EB',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                  onClick={() => router.push(ROUTES.PORTFOLIO_CREATE)}
                >
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 8
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: 'primary.light',
                        color: 'primary.main',
                        mb: 2
                      }}
                    >
                      <AddIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography
                      color="textPrimary"
                      variant="h6"
                      sx={{ fontWeight: 'bold' }}
                    >
                      Создать портфель
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="body2"
                      align="center"
                      sx={{ mt: 1 }}
                    >
                      Добавьте новый портфель активов
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {portfolios.map((portfolio) => (
                <Grid
                  item
                  key={portfolio.id}
                  lg={4}
                  md={6}
                  xs={12}
                >
                  <PortfolioCard portfolio={portfolio} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </>
  );
};

Portfolios.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Portfolios;
