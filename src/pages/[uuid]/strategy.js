import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import { DashboardLayout } from '../../components/dashboard-layout';
import { useAuthContext } from '../../contexts/auth-context';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
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
          flexGrow: 1
        }}
        style={{ paddingTop: 80, paddingBottom: 16, height: '100vh', overflow: 'hidden', boxSizing: 'border-box' }}
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
                    Стратегия инвестирования
                  </Typography>
                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    <Box>
                      <Card>
                        <CardContent>
                          {portfolio?.strategy ? (
                            <Box
                              sx={{
                                '& p': { mb: 2 },
                                '& ul, & ol': { pl: 3, mb: 2 },
                                '& h1, & h2, & h3': { mt: 3, mb: 2, fontWeight: 600 },
                                '& blockquote': {
                                  borderLeft: '4px solid',
                                  borderColor: 'divider',
                                  pl: 2,
                                  color: 'text.secondary',
                                  fontStyle: 'italic'
                                }
                              }}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={{
                                  a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#10B981' }}>
                                      {children}
                                    </a>
                                  )
                                }}
                              >
                                {portfolio.strategy}
                              </ReactMarkdown>
                            </Box>
                          ) : (
                            <Typography color="text.secondary">
                              Стратегия для этого портфеля пока не определена.
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
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

PortfolioStrategy.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default PortfolioStrategy;
