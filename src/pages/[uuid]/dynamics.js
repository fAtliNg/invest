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
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DashboardLayout } from '../../components/dashboard-layout';
import { useAuthContext } from '../../contexts/auth-context';
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { PortfolioSidebar } from '../../components/portfolios/details/portfolio-sidebar';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { formatPrice, formatPercent } from '../../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PERIODS = [
  { value: '1D', label: 'ДЕНЬ' },
  { value: '1W', label: 'НЕДЕЛЯ' },
  { value: '1M', label: 'МЕСЯЦ' },
  { value: '6M', label: 'ПОЛ ГОДА' },
  { value: '1Y', label: 'ГОД' },
  { value: 'ALL', label: 'ВСЕ' }
];

const PortfolioDynamics = () => {
  const router = useRouter();
  const { uuid } = router.query;
  const { isAuthenticated, isLoading } = useAuthContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [portfolio, setPortfolio] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  const [period, setPeriod] = useState('1Y');
  const [summaryData, setSummaryData] = useState(null);
  const [chartPoints, setChartPoints] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const wsRef = useRef(null);
  const assetsRef = useRef([]);

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

  const fetchDynamics = useCallback(async (selectedPeriod, isInitial = false) => {
    if (!uuid) return;
    setChartLoading(true);
    try {
      const res = await axios.get(`/api/portfolios/${uuid}/dynamics?period=${selectedPeriod}`);
      setChartPoints(res.data.points || []);
      // Only update summary on initial load
      if (isInitial || !summaryData) {
        setSummaryData({
          totalCurrent: res.data.totalCurrent,
          totalPurchase: res.data.totalPurchase,
          changeAbs: res.data.changeAbs,
          changePct: res.data.changePct
        });
      }
    } catch (err) {
      console.error('Failed to fetch dynamics:', err);
      setChartPoints([]);
    } finally {
      setChartLoading(false);
    }
  }, [uuid, summaryData]);

  // Fetch summary once on page load
  useEffect(() => {
    if (isAuthenticated && uuid) {
      fetchDynamics(period, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, uuid]);

  // Fetch chart points when period changes
  useEffect(() => {
    if (isAuthenticated && uuid && summaryData) {
      fetchDynamics(period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Fetch portfolio assets for WS tracking
  useEffect(() => {
    if (!isAuthenticated || !uuid) return;
    const fetchAssets = async () => {
      try {
        const res = await axios.get(`/api/portfolios/${uuid}/assets`);
        setAssets(res.data || []);
        assetsRef.current = res.data || [];
      } catch (err) {
        console.error('Failed to fetch assets for WS:', err);
      }
    };
    fetchAssets();
  }, [isAuthenticated, uuid]);

  // WebSocket real-time updates for summary cards (all periods) and chart (1D only)
  useEffect(() => {
    if (!uuid || assetsRef.current.length === 0) return;

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl && typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (window.location.hostname === 'localhost') {
        wsUrl = 'ws://localhost:5001';
      } else {
        wsUrl = `${protocol}//${window.location.host}/api/ws`;
      }
    }
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // Track live prices per secid
    const livePrices = {};
    assetsRef.current.forEach((a) => {
      livePrices[a.secid.toLowerCase()] = a.current_price || a.buy_price || 0;
    });

    ws.onmessage = (event) => {
      if (ws !== wsRef.current) return;
      try {
        const message = JSON.parse(event.data);
        if (message.type !== 'QUOTES_UPDATE' || !Array.isArray(message.data)) return;

        let updated = false;
        for (const quote of message.data) {
          if (!quote.secid) continue;
          const key = quote.secid.toLowerCase();
          if (key in livePrices) {
            const price = typeof quote.price === 'number' ? quote.price : Number(quote.price);
            if (!Number.isNaN(price) && price > 0) {
              livePrices[key] = price;
              updated = true;
            }
          }
        }

        if (!updated) return;

        // Recalculate total portfolio value
        let totalCurrent = 0;
        for (const asset of assetsRef.current) {
          const qty = parseFloat(asset.quantity || 0);
          const price = livePrices[asset.secid.toLowerCase()] || 0;
          totalCurrent += qty * price;
        }
        totalCurrent = Math.round(totalCurrent * 100) / 100;

        // Update summary cards
        setSummaryData((prev) => {
          if (!prev) return prev;
          const totalPurchase = prev.totalPurchase;
          const changeAbs = Math.round((totalCurrent - totalPurchase) * 100) / 100;
          const changePct = totalPurchase > 0
            ? Math.round(((totalCurrent / totalPurchase) - 1) * 10000) / 100
            : 0;
          return { ...prev, totalCurrent, changeAbs, changePct };
        });

        // Only update chart points when period is '1D'
        if (period === '1D') {
          setChartPoints((prev) => {
            const points = [...prev];
            if (points.length === 0) {
              points.push({ date: new Date().toISOString(), value: totalCurrent });
            } else {
              const lastPoint = points[points.length - 1];
              const lastTime = new Date(lastPoint.date).getTime();
              const now = Date.now();
              const intervalMs = 10 * 60 * 1000; // 10 minutes
              if (now - lastTime >= intervalMs) {
                points.push({ date: new Date().toISOString(), value: totalCurrent });
              } else {
                points[points.length - 1] = { ...lastPoint, value: totalCurrent };
              }
            }
            return points;
          });
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
    };
  }, [period, uuid, assets]);

  const handlePeriodChange = (event, newPeriod) => {
    if (!newPeriod) return;
    setPeriod(newPeriod);
  };

  const isPositive = summaryData ? summaryData.changeAbs >= 0 : true;
  const chartColor = isPositive ? theme.palette.success.main : theme.palette.error.main;

  // Ensure at least 2 points for chart to draw a line
  const displayPoints = chartPoints.length > 0
    ? (chartPoints.length === 1
      ? [chartPoints[0], { ...chartPoints[0] }]
      : chartPoints)
    : [];

  const chartData = displayPoints.length > 0 ? {
    labels: displayPoints.map((p) => {
      if (period === '1D') {
        const date = new Date(p.date);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
      const date = new Date(p.date);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: 'Стоимость портфеля',
      data: displayPoints.map((p) => p.value),
      borderColor: chartColor,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, chartColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        return gradient;
      },
      borderWidth: 2,
      pointRadius: displayPoints.length <= 3 ? 3 : 0,
      pointHoverRadius: 4,
      tension: 0.1,
      fill: true
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => formatPrice(context.parsed.y)
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 8 }
      },
      y: {
        position: 'right',
        grid: { borderDash: [4, 4] }
      }
    }
  };


  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          Динамика | {portfolio?.title || 'Загрузка...'} | Profit Case
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
                    Динамика портфеля
                  </Typography>

                  {/* Summary cards */}
                  {summaryData && (
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                      <Card sx={{ minWidth: 180, flex: 1 }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" color="text.secondary">
                            Текущая стоимость
                          </Typography>
                          <Typography variant="h5" fontWeight={600}>
                            {formatPrice(summaryData.totalCurrent)}
                          </Typography>
                        </CardContent>
                      </Card>
                      <Card sx={{ minWidth: 180, flex: 1 }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" color="text.secondary">
                            Стоимость покупки
                          </Typography>
                          <Typography variant="h5" fontWeight={600}>
                            {formatPrice(summaryData.totalPurchase)}
                          </Typography>
                        </CardContent>
                      </Card>
                      <Card sx={{ minWidth: 180, flex: 1 }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" color="text.secondary">
                            Изменение
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight={600}
                            color={summaryData.changeAbs >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatPrice(summaryData.changeAbs)}{' '}
                            <Typography
                              component="span"
                              variant="body1"
                              color={summaryData.changePct >= 0 ? 'success.main' : 'error.main'}
                            >
                              ({formatPercent(summaryData.changePct)})
                            </Typography>
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                  {/* Chart */}
                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardHeader
                        title="График"
                        action={
                          <ToggleButtonGroup
                            value={period}
                            exclusive
                            onChange={handlePeriodChange}
                            size="small"
                            color="primary"
                          >
                            {PERIODS.map((p) => (
                              <ToggleButton key={p.value} value={p.value}>
                                {isSmallScreen ? p.value : p.label}
                              </ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                        }
                      />
                      <Divider />
                      <CardContent sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        {chartLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                          </Box>
                        ) : chartData ? (
                          <Box sx={{ height: '100%', position: 'relative' }}>
                            <Line data={chartData} options={chartOptions} />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography color="text.secondary">
                              {chartPoints.length === 0
                                ? 'Нет данных для отображения. Добавьте бумаги в портфель.'
                                : 'Не удалось загрузить данные динамики.'}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
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

PortfolioDynamics.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default PortfolioDynamics;
