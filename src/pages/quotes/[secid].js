import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  CircularProgress,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DashboardLayout } from '../../components/dashboard-layout';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatNumber, formatPrice, formatPercent, formatLargeNumber } from '../../utils/format';

// Register ChartJS components
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
  { value: '1D', label: 'день', short: 'д', interval: 10, duration: 1 },
  { value: '1W', label: 'неделя', short: 'н', interval: 60, duration: 7 },
  { value: '1M', label: 'месяц', short: 'м', interval: 24, duration: 30 },
  { value: '6M', label: 'пол года', short: '6м', interval: 24, duration: 180 },
  { value: '1Y', label: 'год', short: 'г', interval: 24, duration: 365 },
  { value: 'ALL', label: 'все', short: 'все', interval: 31, duration: 365 * 5 }
];

const QuoteDetails = () => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { secid } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityInfo, setSecurityInfo] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [period, setPeriod] = useState('1Y');
  const [stats, setStats] = useState({
    yearLow: null,
    yearHigh: null
  });
  const [candles, setCandles] = useState([]);
  const wsRef = useRef(null);

  // Determine color based on price change
  // Default to neutral or negative if data not loaded yet, but typically we want to wait for data
  const isPositive = marketData?.LASTTOPREVPRICE >= 0;
  const color = isPositive ? 'success.main' : 'error.main';
  const chartColor = isPositive ? theme.palette.success.main : theme.palette.error.main;

  useEffect(() => {
    if (candles.length === 0) return;

    setChartData({
        labels: candles.map(c => {
             const date = new Date(c.end);
             if (period === '1D') {
               return date.toLocaleTimeString('ru-RU', {
                 hour: '2-digit',
                 minute: '2-digit'
               });
             }
             return date.toLocaleDateString('ru-RU', { 
               day: 'numeric', 
               month: 'short'
             });
        }),
        datasets: [
            {
                label: 'Цена',
                data: candles.map(c => c.close),
                borderColor: chartColor,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, chartColor); 
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); 
                    return gradient;
                },
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.1,
                fill: true
            }
        ]
    });
  }, [candles, chartColor, period, theme]);

  const fetchCandles = async (engine, market, boardid, selectedPeriod) => {
    const periodConfig = PERIODS.find(p => p.value === selectedPeriod);
    if (!periodConfig) return [];

    const till = new Date();
    const from = new Date();
    from.setDate(from.getDate() - periodConfig.duration);
    
    const fromStr = from.toISOString().split('T')[0];
    const tillStr = till.toISOString().split('T')[0];
    
    try {
      const res = await axios.get(`https://iss.moex.com/iss/engines/${engine}/markets/${market}/boards/${boardid}/securities/${secid}/candles.json?from=${fromStr}&till=${tillStr}&interval=${periodConfig.interval}`);
      const parsed = parseMoexData(res.data, 'candles');
      if (selectedPeriod === '1D' && parsed.length > 0) {
        const dates = parsed.map(c => new Date(c.end));
        const maxDate = dates.reduce((max, d) => (d > max ? d : max), dates[0]);
        const maxDateString = maxDate.toDateString();
        return parsed.filter(c => new Date(c.end).toDateString() === maxDateString);
      }
      return parsed;
    } catch (err) {
      console.error('Error fetching candles:', err);
      return [];
    }
  };

  const parseMoexData = (json, tableName) => {
    if (!json || !json[tableName]) return [];
    const columns = json[tableName].columns;
    const data = json[tableName].data;
    return data.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  };

  useEffect(() => {
    if (!secid) return;

    const fetchBaseData = async () => {
      setLoading(true);
      try {
        // 1. Fetch security info
        const infoRes = await axios.get(`https://iss.moex.com/iss/securities/${secid}.json`);
        const boards = parseMoexData(infoRes.data, 'boards');
        const description = parseMoexData(infoRes.data, 'description');
        
        let targetBoard = boards.find(b => b.is_primary === 1);
        if (!targetBoard) {
          targetBoard = boards.find(b => ['TQBR', 'TQCB', 'TQOB', 'TQTF'].includes(b.boardid));
        }
        if (!targetBoard && boards.length > 0) targetBoard = boards[0];
        
        if (!targetBoard) throw new Error('Board not found');

        const { engine, market, boardid } = targetBoard;

        const descMap = {};
        description.forEach(item => { descMap[item.name] = item.value; });

        const rawType = descMap['TYPE'] || '';
        const typeMap = {
          common_share: 'Обыкновенная акция',
          preferred_share: 'Привилегированная акция',
          depositary_receipt: 'Депозитарная расписка',
          exchange_bond: 'Торговая облигация',
          corporate_bond: 'Корпоративная облигация',
          government_bond: 'Государственная облигация',
          subfederal_bond: 'Региональная облигация',
          municipal_bond: 'Муниципальная облигация',
          etf: 'Биржевой фонд (ETF)',
          ppif: 'ПИФ',
          futures: 'Фьючерсный контракт',
          option: 'Опционный контракт',
          currency: 'Валюта'
        };

        const secInfo = {
            secid,
            shortname: descMap['NAME'] || descMap['SHORTNAME'] || secid,
            description: typeMap[rawType] || rawType,
            issuesize: descMap['ISSUESIZE'] ? Number(descMap['ISSUESIZE']) : null,
            isin: descMap['ISIN'],
            ...targetBoard
        };
        setSecurityInfo(secInfo);

        // 2. Market Data
        const marketRes = await axios.get(`https://iss.moex.com/iss/engines/${engine}/markets/${market}/boards/${boardid}/securities/${secid}.json`);
        const marketDataParsed = parseMoexData(marketRes.data, 'marketdata');
        const securitiesParsed = parseMoexData(marketRes.data, 'securities');
        
        const currentMarketData = {
            ...(securitiesParsed.length > 0 ? securitiesParsed[0] : {}),
            ...(marketDataParsed.length > 0 ? marketDataParsed[0] : {})
        };
        setMarketData(currentMarketData);

        // 3. Initial Chart & Stats (1 Year for stats)
        const candles1Y = await fetchCandles(engine, market, boardid, '1Y');
        
        if (candles1Y.length > 0) {
            const highs = candles1Y.map(c => c.high);
            const lows = candles1Y.map(c => c.low);
            setStats({
                yearHigh: Math.max(...highs),
                yearLow: Math.min(...lows)
            });
            
            // Set initial chart data
            setCandles(candles1Y);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchBaseData();
  }, [secid]);

  useEffect(() => {
    if (!secid) return;

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    if (!wsUrl && typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (window.location.hostname === 'localhost') {
        wsUrl = 'ws://localhost:5001';
      } else {
        wsUrl = `${protocol}//${window.location.host}/api/ws`;
      }
    }

    if (!wsUrl) {
      return;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'QUOTES_UPDATE' && Array.isArray(message.data)) {
          const quote = message.data.find((item) => item.secid === secid);
          if (quote) {
            setMarketData((prev) => ({
              ...(prev || {}),
              LAST: quote.price,
              HIGH: quote.high,
              LOW: quote.low,
              CHANGE: quote.change,
              LASTTOPREVPRICE: quote.change_pct,
              VOLTODAY: quote.volume,
              LOTSIZE: quote.lot_size
            }));
          }
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    ws.onerror = () => {
      wsRef.current = null;
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [secid]);

  const handlePeriodChange = async (event, newPeriod) => {
    if (!newPeriod || !securityInfo) return;
    setPeriod(newPeriod);
    
    // Fetch new candles
    const { engine, market, boardid } = securityInfo;
    const newCandles = await fetchCandles(engine, market, boardid, newPeriod);
    setCandles(newCandles);
  };

  if (loading) {
    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        </DashboardLayout>
    );
  }

  if (error) {
    return (
        <DashboardLayout>
            <Box sx={{ p: 3 }}>
                <Typography color="error">{error}</Typography>
                <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Назад</Button>
            </Box>
        </DashboardLayout>
    );
  }

  // Derived Values
  const marketCap = (marketData?.LAST && securityInfo?.issuesize) 
    ? marketData.LAST * securityInfo.issuesize 
    : null;

  const lotSize = marketData?.LOTSIZE || 1;
  const volumeShares = marketData?.VOLTODAY ? marketData.VOLTODAY * lotSize : null;
  
  return (
    <DashboardLayout>
      <Head>
        <title>{securityInfo?.shortname} - Детали</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth={false}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => router.push('/quotes')}
            >
                К списку
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Header / Price Card */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography variant="h4" component="h1">
                                    {securityInfo?.shortname} ({securityInfo?.secid})
                                </Typography>
                                <Typography color="textSecondary" variant="subtitle1">
                                    {securityInfo?.description}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right', xs: 'left' } }}>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                                    {formatPrice(marketData?.LAST || marketData?.PREVPRICE)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { md: 'flex-end', xs: 'flex-start' }, gap: 1 }}>
                                    <Typography variant="h6" color={color}>
                                        {marketData?.CHANGE > 0 ? '+' : ''}{marketData?.CHANGE} 
                                    </Typography>
                                    <Typography variant="h6" color={color}>
                                        ({marketData?.LASTTOPREVPRICE > 0 ? '+' : ''}{marketData?.LASTTOPREVPRICE}%)
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="textSecondary">
                                    Режим реального времени (MOEX)
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Main Chart Section */}
            <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <CardHeader title="График" sx={{ p: 0 }} />
                        <ToggleButtonGroup
                            value={period}
                            exclusive
                            onChange={handlePeriodChange}
                            size="small"
                            color="primary"
                        >
                            {PERIODS.map((p) => (
                                <ToggleButton key={p.value} value={p.value}>
                                    {isSmallScreen ? p.short : p.label}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>
                    <Divider />
                    <CardContent>
                        <Box sx={{ height: 400, position: 'relative' }}>
                            {chartData && (
                                <Line 
                                    data={chartData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        interaction: {
                                            mode: 'index',
                                            intersect: false,
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
                                    }} 
                                />
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Key Statistics Side Panel */}
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader title="Ключевая статистика" />
                    <Divider />
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Пред. закр.</Typography>
                                <Typography variant="body1">{formatPrice(marketData?.PREVPRICE)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Открытие</Typography>
                                <Typography variant="body1">{formatPrice(marketData?.OPEN)}</Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Дн. диапазон</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatNumber(marketData?.LOW)} - {formatNumber(marketData?.HIGH)}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">52 недели</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatNumber(stats.yearLow)} - {formatNumber(stats.yearHigh)}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Объем</Typography>
                                <Typography variant="body1">{formatLargeNumber(volumeShares)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Рын. кап.</Typography>
                                <Typography variant="body1">{formatLargeNumber(marketCap)}</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                             <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Лот</Typography>
                                <Typography variant="body1">{formatNumber(lotSize)}</Typography>
                            </Grid>
                             <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">ISIN</Typography>
                                <Typography variant="body2">{securityInfo?.isin || '-'}</Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default QuoteDetails;
