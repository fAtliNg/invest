import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Tooltip as MuiTooltip,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { DashboardLayout } from '../../../components/dashboard-layout';
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatNumber, formatPrice, formatPercent, formatLargeNumber } from '../../../utils/format';

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
  const { secid, type } = router.query;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityInfo, setSecurityInfo] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [lastDayStats, setLastDayStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [period, setPeriod] = useState('1Y');
  const [stats, setStats] = useState({
    yearLow: null,
    yearHigh: null
  });
  const [candles, setCandles] = useState([]);
  const [dividends, setDividends] = useState({
    last: null,
    lastDate: null,
    trailingSum: null,
    history: []
  });
  const [coupons, setCoupons] = useState({
    list: [],
    paidCount: 0,
    totalCount: 0,
    periodDays: null
  });
  const [detailTab, setDetailTab] = useState('security');
  const [volumeDate, setVolumeDate] = useState(null);
  const [volumeStats, setVolumeStats] = useState(null);
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [volumeError, setVolumeError] = useState(null);
  const wsRef = useRef(null);

  // Determine color based on price change
  // Default to neutral or negative if data not loaded yet, but typically we want to wait for data
  const isPositive = marketData?.LASTTOPREVPRICE >= 0;
  const color = isPositive ? 'success.main' : 'error.main';
  const chartColor = isPositive ? theme.palette.success.main : theme.palette.error.main;

  useEffect(() => {
    if (candles.length === 0) return;

    setChartData({
      labels: candles.map((c, index) => {
        const isLast = index === candles.length - 1;
        if (period === '1D') {
          const date = isLast ? new Date() : new Date(c.end);
          return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        const date = new Date(c.end);
        return date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short'
        });
      }),
      datasets: [
        {
          label: 'Цена',
          data: candles.map((c) => c.close),
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

  const fetchCandles = useCallback(async (engine, market, boardid, selectedPeriod) => {
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
  }, [secid]);

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
          exchange_ppif: 'БПИФ',
          stock_ppif: 'Биржевой ПИФ',
          futures: 'Фьючерсный контракт',
          option: 'Опционный контракт',
          currency: 'Валюта'
        };

        const secInfo = {
            secid,
            typeCode: rawType,
            fullName: descMap['NAME'] || null,
            shortname: descMap['SHORTNAME'] || descMap['NAME'] || secid,
            description: typeMap[rawType] || rawType,
            issuesize: descMap['ISSUESIZE'] ? Number(descMap['ISSUESIZE']) : null,
            isin: descMap['ISIN'] || null,
            regNumber: descMap['REGNUMBER'] || null,
            faceValue: descMap['FACEVALUE'] ? Number(descMap['FACEVALUE']) : null,
            faceUnit: descMap['FACEUNIT'] || null,
            issueDate: descMap['ISSUEDATE'] || null,
            listLevel: descMap['LISTLEVEL'] || null,
            isQualifiedInvestors: descMap['ISQUALIFIEDINVESTORS'] || null,
            morningSession: descMap['MORNINGSESSION'] || null,
            eveningSession: descMap['EVENINGSESSION'] || null,
            groupCode: descMap['GROUP'] || null,
            emitentTitle: descMap['EMITENT_TITLE'] || null,
            emitentInn: descMap['EMITENT_INN'] || null,
            emitentOkved: descMap['EMITENT_OKVED'] || null,
            ...targetBoard
        };
        setSecurityInfo(secInfo);

        const marketRes = await axios.get(`https://iss.moex.com/iss/engines/${engine}/markets/${market}/boards/${boardid}/securities/${secid}.json`);
        const marketDataParsed = parseMoexData(marketRes.data, 'marketdata');
        const securitiesParsed = parseMoexData(marketRes.data, 'securities');
        
        const currentMarketData = {
            ...(securitiesParsed.length > 0 ? securitiesParsed[0] : {}),
            ...(marketDataParsed.length > 0 ? marketDataParsed[0] : {})
        };
        setMarketData(currentMarketData);

        const candles1Y = await fetchCandles(engine, market, boardid, '1Y');
        
        if (candles1Y.length > 0) {
            const highs = candles1Y.map(c => c.high);
            const lows = candles1Y.map(c => c.low);
            setStats({
                yearHigh: Math.max(...highs),
                yearLow: Math.min(...lows)
            });
            setCandles(candles1Y);
        }

        try {
          const dividendsRes = await axios.get(`https://iss.moex.com/iss/securities/${secid}/dividends.json?iss.meta=off`);
          const dividendsData = parseMoexData(dividendsRes.data, 'dividends');
          if (dividendsData.length > 0) {
            const sorted = [...dividendsData].sort((a, b) => {
              const da = new Date(a.registryclosedate);
              const db = new Date(b.registryclosedate);
              return da.getTime() - db.getTime();
            });
            const last = sorted[sorted.length - 1];
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const trailingSum = sorted
              .filter(d => {
                const dDate = new Date(d.registryclosedate);
                return dDate >= oneYearAgo;
              })
              .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            setDividends({
              last: Number(last.value) || null,
              lastDate: last.registryclosedate || null,
              trailingSum: trailingSum || null,
              history: sorted.reverse()
            });
          }
        } catch (divErr) {
          console.error('Failed to load dividends', divErr);
        }

        try {
          const historyBaseUrl = `https://iss.moex.com/iss/history/engines/${engine}/markets/${market}/boards/${boardid}/securities/${secid}.json?iss.meta=off`;
          const firstHistoryRes = await axios.get(`${historyBaseUrl}&limit=1`);
          const cursor = firstHistoryRes.data?.['history.cursor'];
          const totalRows = cursor && cursor.data && cursor.data[0] ? cursor.data[0][1] : null;
          let lastRow = null;
          if (totalRows && totalRows > 0) {
            if (totalRows === 1) {
              const rows = parseMoexData(firstHistoryRes.data, 'history');
              lastRow = rows[0] || null;
            } else {
              const start = totalRows - 1;
              const lastHistoryRes = await axios.get(`${historyBaseUrl}&limit=1&start=${start}`);
              const rows = parseMoexData(lastHistoryRes.data, 'history');
              lastRow = rows[0] || null;
            }
          }
          if (lastRow) {
            setLastDayStats({
              tradeDate: lastRow.TRADEDATE || null,
              numTrades: lastRow.NUMTRADES != null ? Number(lastRow.NUMTRADES) : null,
              open: lastRow.OPEN != null ? Number(lastRow.OPEN) : null,
              low: lastRow.LOW != null ? Number(lastRow.LOW) : null,
              high: lastRow.HIGH != null ? Number(lastRow.HIGH) : null,
              close: lastRow.CLOSE != null ? Number(lastRow.CLOSE) : null,
              value: lastRow.VALUE != null ? Number(lastRow.VALUE) : null,
              volume: lastRow.VOLUME != null ? Number(lastRow.VOLUME) : null,
              marketPrice2: lastRow.MARKETPRICE2 != null ? Number(lastRow.MARKETPRICE2) : null,
              marketPrice3: lastRow.MARKETPRICE3 != null ? Number(lastRow.MARKETPRICE3) : null,
              mp2ValTrd: lastRow.MP2VALTRD != null ? Number(lastRow.MP2VALTRD) : null,
              mp3TradesValue: lastRow.MARKETPRICE3TRADESVALUE != null ? Number(lastRow.MARKETPRICE3TRADESVALUE) : null
            });
          }
        } catch (historyErr) {
          console.error('Failed to load last day history', historyErr);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchBaseData();
  }, [secid, fetchCandles]);

  useEffect(() => {
    if (!securityInfo || !securityInfo.engine || !securityInfo.market) return;

    const fetchCoupons = async () => {
      try {
        const res = await axios.get(`https://iss.moex.com/iss/securities/${secid}/bondization.json?iss.meta=off&iss.only=coupons`);
        const couponsData = parseMoexData(res.data, 'coupons');
        if (!couponsData || couponsData.length === 0) {
          setCoupons({
            list: [],
            paidCount: 0,
            totalCount: 0,
            periodDays: null
          });
          return;
        }
        const today = new Date();
        const totalCount = couponsData.length;
        const paidCount = couponsData.filter(c => {
          if (!c.coupondate) return false;
          const d = new Date(c.coupondate);
          return d.getTime() < today.getTime();
        }).length;
        let periodDays = null;
        if (couponsData.length > 1 && couponsData[0].coupondate && couponsData[1].coupondate) {
          const d1 = new Date(couponsData[0].coupondate);
          const d2 = new Date(couponsData[1].coupondate);
          periodDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        }
        setCoupons({
          list: couponsData,
          paidCount,
          totalCount,
          periodDays
        });
      } catch (err) {
        console.error('Failed to load coupons', err);
      }
    };

    fetchCoupons();
  }, [securityInfo, secid]);

  useEffect(() => {
    if (lastDayStats?.tradeDate && !volumeDate) {
      setVolumeDate(lastDayStats.tradeDate);
    }
  }, [lastDayStats, volumeDate]);

  useEffect(() => {
    if (!securityInfo || !securityInfo.engine || !securityInfo.market || !securityInfo.boardid) return;
    if (!volumeDate) return;

    const fetchVolumes = async () => {
      setVolumeLoading(true);
      setVolumeError(null);
      try {
        const dateObj = new Date(volumeDate);
        const dateStr = Number.isNaN(dateObj.getTime())
          ? volumeDate
          : dateObj.toISOString().split('T')[0];
        const url = `https://iss.moex.com/iss/history/engines/${securityInfo.engine}/markets/${securityInfo.market}/securities/${secid}.json?iss.meta=off&from=${dateStr}&till=${dateStr}`;
        const res = await axios.get(url);
        const rows = parseMoexData(res.data, 'history');

        if (!rows || rows.length === 0) {
          setVolumeStats(null);
          return;
        }

        const isRepoBoard = (boardid) => {
          if (!boardid) return false;
          const upper = String(boardid).toUpperCase();
          return upper.includes('RP') || upper.includes('REPO');
        };

        const buckets = [
          {
            key: 'main',
            label: 'Основной рынок',
            matcher: (row) => row.BOARDID === securityInfo.boardid
          },
          {
            key: 'negotiated',
            label: 'Переговорные сделки',
            matcher: (row) => row.BOARDID !== securityInfo.boardid && !isRepoBoard(row.BOARDID)
          },
          {
            key: 'repo',
            label: 'Рынок РЕПО',
            matcher: (row) => isRepoBoard(row.BOARDID)
          }
        ];

        const aggregated = buckets.map((bucket) => ({
          key: bucket.key,
          label: bucket.label,
          numTrades: 0,
          volume: 0,
          value: 0,
          hasData: false
        }));

        rows.forEach((row) => {
          const targetBucketIndex = aggregated.findIndex((bucket, index) =>
            buckets[index].matcher(row)
          );
          if (targetBucketIndex === -1) {
            return;
          }
          const bucket = aggregated[targetBucketIndex];
          const numTrades = row.NUMTRADES != null ? Number(row.NUMTRADES) : null;
          const volume = row.VOLUME != null ? Number(row.VOLUME) : null;
          const value = row.VALUE != null ? Number(row.VALUE) : null;

          if (numTrades != null) {
            bucket.numTrades += numTrades;
          }
          if (volume != null) {
            bucket.volume += volume;
          }
          if (value != null) {
            bucket.value += value;
          }
          if (numTrades != null || volume != null || value != null) {
            bucket.hasData = true;
          }
        });

        const marketRows = aggregated
          .filter((bucket) => bucket.hasData)
          .map((bucket) => ({
            key: bucket.key,
            label: bucket.label,
            numTrades: bucket.numTrades || null,
            volume: bucket.volume || null,
            value: bucket.value || null,
            isTotal: false
          }));

        if (marketRows.length === 0) {
          setVolumeStats(null);
          return;
        }

        const withoutRepoBuckets = aggregated.filter(
          (bucket) => bucket.key === 'main' || bucket.key === 'negotiated'
        );
        const totalsWithoutRepo = withoutRepoBuckets.reduce(
          (acc, bucket) => ({
            numTrades: acc.numTrades + (bucket.numTrades || 0),
            volume: acc.volume + (bucket.volume || 0),
            value: acc.value + (bucket.value || 0)
          }),
          { numTrades: 0, volume: 0, value: 0 }
        );

        const allTotals = aggregated.reduce(
          (acc, bucket) => ({
            numTrades: acc.numTrades + (bucket.numTrades || 0),
            volume: acc.volume + (bucket.volume || 0),
            value: acc.value + (bucket.value || 0)
          }),
          { numTrades: 0, volume: 0, value: 0 }
        );

        if (totalsWithoutRepo.numTrades || totalsWithoutRepo.volume || totalsWithoutRepo.value) {
          marketRows.push({
            key: 'totalWithoutRepo',
            label: 'Всего (без РЕПО)',
            numTrades: totalsWithoutRepo.numTrades || null,
            volume: totalsWithoutRepo.volume || null,
            value: totalsWithoutRepo.value || null,
            isTotal: true
          });
        }

        if (allTotals.numTrades || allTotals.volume || allTotals.value) {
          marketRows.push({
            key: 'totalAll',
            label: 'Всего',
            numTrades: allTotals.numTrades || null,
            volume: allTotals.volume || null,
            value: allTotals.value || null,
            isTotal: true
          });
        }

        setVolumeStats(marketRows);
      } catch (err) {
        console.error('Failed to load volumes', err);
        setVolumeError('Не удалось загрузить объемы торгов');
        setVolumeStats(null);
      } finally {
        setVolumeLoading(false);
      }
    };

    fetchVolumes();
  }, [securityInfo, secid, volumeDate]);

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
      // Ignore messages from previous/closed connections
      if (ws !== wsRef.current) return;

      try {
        const message = JSON.parse(event.data);
        if (message.type === 'QUOTES_UPDATE' && Array.isArray(message.data)) {
          const quote = message.data.find((item) => 
            item.secid && secid && item.secid.toLowerCase() === secid.toLowerCase()
          );
          if (quote) {
            const price = typeof quote.price === 'number' ? quote.price : Number(quote.price);

            setMarketData((prev) => ({
              ...(prev || {}),
              LAST: price,
              HIGH: quote.high,
              LOW: quote.low,
              CHANGE: quote.change,
              LASTTOPREVPRICE: quote.change_pct,
              VOLTODAY: quote.volume,
              LOTSIZE: quote.lot_size
            }));

            if (!Number.isNaN(price)) {
              setCandles((prevCandles) => {
                if (!Array.isArray(prevCandles) || prevCandles.length === 0) {
                  return prevCandles;
                }

                const lastIndex = prevCandles.length - 1;
                const last = prevCandles[lastIndex];
                const nextCandles = [...prevCandles];

                if (period === '1D') {
                  const periodConfig = PERIODS.find((p) => p.value === '1D');
                  const intervalMinutes = periodConfig?.interval ?? 10;
                  const intervalMs = intervalMinutes * 60 * 1000;

                  const lastEndDate = new Date(last.end);
                  const now = new Date();

                  const lastEndTime = lastEndDate.getTime();
                  const nowTime = now.getTime();

                  const canUseTimes =
                    !Number.isNaN(lastEndTime) && !Number.isNaN(nowTime);
                  const shouldAddNewCandle =
                    canUseTimes && nowTime - lastEndTime >= intervalMs;

                  if (shouldAddNewCandle) {
                    const newEnd = new Date(lastEndTime + intervalMs).toISOString();
                    const newCandle = {
                      ...last,
                      end: newEnd,
                      open: last.close != null ? last.close : price,
                      close: price,
                      high: price,
                      low: price
                    };

                    nextCandles.push(newCandle);
                    const MAX_POINTS = 1000;
                    return nextCandles.length > MAX_POINTS
                      ? nextCandles.slice(nextCandles.length - MAX_POINTS)
                      : nextCandles;
                  }
                }

                const updatedLast = {
                  ...last,
                  close: price,
                  high:
                    last.high != null
                      ? Math.max(Number(last.high), price)
                      : price,
                  low:
                    last.low != null
                      ? Math.min(Number(last.low), price)
                      : price
                };

                nextCandles[lastIndex] = updatedLast;
                return nextCandles;
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [secid, period]);

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
          <Typography color="error">
            {error}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
          >
            Назад
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  const getBackLink = () => {
    if (type) return `/quotes/${type}`;
    if (!securityInfo) return '/quotes/share';
    const typeCode = securityInfo.typeCode;
    
    if (['common_share', 'preferred_share', 'depositary_receipt'].includes(typeCode)) return '/quotes/share';
    if (['exchange_bond', 'corporate_bond', 'government_bond', 'subfederal_bond', 'municipal_bond', 'ofz_bond'].includes(typeCode)) return '/quotes/bond';
    if (['etf', 'ppif', 'exchange_ppif', 'stock_ppif'].includes(typeCode)) return '/quotes/fund';
    if (['futures', 'option'].includes(typeCode)) return '/quotes/future';
    if (typeCode === 'currency' || securityInfo.groupCode === 'currency_selt') return '/quotes/currency';
    
    return '/quotes/share';
  };

  const marketCap = (marketData?.LAST && securityInfo?.issuesize) 
    ? marketData.LAST * securityInfo.issuesize 
    : null;

  const lotSize = marketData?.LOTSIZE || 1;
  const volumeShares = marketData?.VOLTODAY ? marketData.VOLTODAY * lotSize : null;
  const dividendYieldTrailing = dividends.trailingSum && marketData?.LAST
    ? (dividends.trailingSum / marketData.LAST) * 100
    : null;
  const dividendYieldLast = dividends.last && marketData?.LAST
    ? (dividends.last / marketData.LAST) * 100
    : null;
  
  const typeCode = securityInfo?.typeCode || '';
  
  const isBond = ['exchange_bond', 'corporate_bond', 'government_bond', 'subfederal_bond', 'municipal_bond'].includes(typeCode) || 
                 typeCode.includes('bond') || 
                 (securityInfo?.description || '').toLowerCase().includes('облигация');

  const isFund = ['etf', 'ppif', 'exchange_ppif', 'stock_ppif'].includes(typeCode) || 
                 typeCode.includes('ppif') || 
                 typeCode.includes('etf') || 
                 ['фонд', 'пиф', 'etf', 'bpid', 'бпиф'].some(t => (securityInfo?.description || '').toLowerCase().includes(t));
  
  const isCurrency = typeCode === 'currency';
  const isFutures = ['futures', 'option'].includes(typeCode) || typeCode.includes('futures');
                 
  const bondYield = isBond
    ? (marketData?.YIELD != null ? marketData.YIELD : marketData?.YIELDATPREVWAPRICE)
    : null;
  const bondMaturityDate = isBond && marketData?.MATDATE ? marketData.MATDATE : null;
  const bondNextCouponDate = isBond && marketData?.NEXTCOUPON ? marketData.NEXTCOUPON : null;
  const bondAccruedInt = isBond && marketData?.ACCRUEDINT != null ? marketData.ACCRUEDINT : null;
  const bondCouponValue = isBond && marketData?.COUPONVALUE != null ? marketData.COUPONVALUE : null;
  const bondCouponPercent = isBond
    ? (marketData?.COUPONPERCENT != null
        ? marketData.COUPONPERCENT
        : (coupons.list[0]?.valueprc != null ? coupons.list[0].valueprc : null))
    : null;
  const formatYesNo = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (value === true || value === false) return value ? 'Да' : 'Нет';
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric === 1 ? 'Да' : 'Нет';
    }
    return String(value);
  };
  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('ru-RU');
  };
  const tradeDayText = `Данные отображаются за ${lastDayStats?.tradeDate ? formatDate(lastDayStats.tradeDate) : '-'}`;
  const tabs = [
    { value: 'security', label: 'Данные о бумаге' },
    { value: 'trading', label: 'Торговые данные' }
  ];
  const extraTabs = [
    { 
      value: isBond ? 'coupons' : (isCurrency ? 'stats' : 'dividends'), 
      label: isBond ? 'Купоны' : (isCurrency ? 'Статистика' : 'Дивиденды') 
    }
  ];
  const keyIndicatorTabs = isSmallScreen ? [...tabs, ...extraTabs] : tabs;
  const formatDividendYield = (item) => {
    const raw = item.yield != null ? item.yield : item.dividendyield != null ? item.dividendyield : null;
    if (raw == null) return '—';
    const num = Number(raw);
    if (Number.isNaN(num)) return '—';
    return `${num.toFixed(2)} %`;
  };
  const formatDividendAmount = (item) => {
    const value = item.value_rub != null ? item.value_rub : item.value != null ? item.value : null;
    if (value == null) return '—';
    const num = Number(value);
    if (Number.isNaN(num)) return '—';
    return `${formatPrice(num)}`;
  };
  const couponsContent = (
    <Box>
      <Table
        size="small"
        sx={{
          '& .MuiTableCell-root': { borderBottom: '1px solid rgba(255,255,255,0.06)', py: 1 },
          '& thead .MuiTableCell-root': { fontSize: 12, color: 'text.secondary' },
          '& tbody .MuiTableRow-root:nth-of-type(odd)': { backgroundColor: 'action.hover' }
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Дата</TableCell>
            <TableCell align="right">Доходность</TableCell>
            <TableCell align="right">Сумма</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {coupons.list.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{formatDate(item.coupondate)}</TableCell>
              <TableCell align="right">{item.valueprc != null ? `${item.valueprc}%` : '-'}</TableCell>
              <TableCell align="right">{item.value != null ? formatPrice(item.value) : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {coupons.list.length === 0 && (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mt: 2 }}
        >
          Данные по купонам отсутствуют.
        </Typography>
      )}
    </Box>
  );
  const dividendsContent = (
    <Box>
      <Table
        size="small"
        sx={{
          '& .MuiTableCell-root': { borderBottom: '1px solid rgba(255,255,255,0.06)', py: 1 },
          '& thead .MuiTableCell-root': { fontSize: 12, color: 'text.secondary' },
          '& tbody .MuiTableRow-root:nth-of-type(odd)': { backgroundColor: 'action.hover' }
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Дата</TableCell>
            <TableCell align="right">Сумма</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dividends.history.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{formatDate(item.registryclosedate)}</TableCell>
              <TableCell align="right">{formatDividendAmount(item)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {dividends.history.length === 0 && (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mt: 2 }}
        >
          Данные по дивидендам отсутствуют.
        </Typography>
      )}
    </Box>
  );

  const fundContent = (
    <Box>
      <Table
        size="small"
        sx={{
          '& .MuiTableCell-root': { borderBottom: '1px solid rgba(255,255,255,0.06)', py: 1 },
          '& tbody .MuiTableRow-root:nth-of-type(odd)': { backgroundColor: 'action.hover' }
        }}
      >
        <TableBody>
           <TableRow>
             <TableCell sx={{ color: 'text.secondary', border: 0 }}>Тип</TableCell>
             <TableCell align="right" sx={{ border: 0 }}>{securityInfo?.description}</TableCell>
          </TableRow>
           <TableRow>
             <TableCell sx={{ color: 'text.secondary', border: 0 }}>ISIN</TableCell>
             <TableCell align="right" sx={{ border: 0 }}>{securityInfo?.isin}</TableCell>
          </TableRow>
           <TableRow>
             <TableCell sx={{ color: 'text.secondary', border: 0 }}>Валюта</TableCell>
             <TableCell align="right" sx={{ border: 0 }}>{marketData?.CURRENCYID || 'RUB'}</TableCell>
          </TableRow>
          {marketData?.ETFSETTLEPRICE && (
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', border: 0 }}>СЧА</TableCell>
              <TableCell align="right" sx={{ border: 0 }}>{formatPrice(marketData.ETFSETTLEPRICE)}</TableCell>
            </TableRow>
          )}
           <TableRow>
             <TableCell sx={{ color: 'text.secondary', border: 0 }}>Дата начала</TableCell>
             <TableCell align="right" sx={{ border: 0 }}>{formatDate(securityInfo?.issueDate)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );

  const statsContent = (
    <Box>
      <Table
        size="small"
        sx={{
          '& .MuiTableCell-root': { borderBottom: '1px solid rgba(255,255,255,0.06)', py: 1 },
          '& tbody .MuiTableRow-root:nth-of-type(odd)': { backgroundColor: 'action.hover' }
        }}
      >
        <TableBody>
          <TableRow>
            <TableCell sx={{ color: 'text.secondary', border: 0 }}>Открытие</TableCell>
            <TableCell align="right" sx={{ border: 0 }}>{formatPrice(marketData?.OPEN ?? lastDayStats?.open)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: 'text.secondary', border: 0 }}>Минимум</TableCell>
            <TableCell align="right" sx={{ border: 0 }}>{formatPrice(marketData?.LOW ?? lastDayStats?.low)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: 'text.secondary', border: 0 }}>Максимум</TableCell>
            <TableCell align="right" sx={{ border: 0 }}>{formatPrice(marketData?.HIGH ?? lastDayStats?.high)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );

  const futuresInfoContent = (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Базовый актив</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{marketData?.ASSETCODE || '-'}</Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Наименование</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{securityInfo?.shortname || '-'}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Тикер</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{secid}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Тип контракта</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{securityInfo?.description || 'Фьючерс'}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Последний день обращения</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{formatDate(marketData?.LASTTRADEDATE)}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Лотность</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{marketData?.LOTVOLUME || '-'}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Гарантийное обеспечение</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{marketData?.INITIALMARGIN ? formatPrice(marketData.INITIALMARGIN) : '-'}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Шаг цены</Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">{marketData?.MINSTEP ? formatNumber(marketData.MINSTEP) : '-'}</Typography>
        </Grid>
      </Grid>
    </Box>
  );

  const handleDetailTabChange = (event, newValue) => {
    if (newValue) {
      setDetailTab(newValue);
    }
  };
  
  
  return (
    <DashboardLayout>
      <Head>
        <title>{securityInfo?.shortname} - Детали</title>
      </Head>
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 4 }}
      >
        <Container maxWidth={false}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(getBackLink())}
            >
              К списку
            </Button>
          </Box>

          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              xs={12}
            >
              <Card>
                <CardContent>
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                  >
                    <Grid
                      item
                      xs={12}
                      md={6}
                    >
                      <Typography
                        variant="h4"
                        component="h1"
                      >
                        {securityInfo?.shortname} ({securityInfo?.secid})
                      </Typography>
                      <Typography
                        color="textSecondary"
                        variant="subtitle1"
                      >
                        {securityInfo?.description}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={6}
                      sx={{ textAlign: { md: 'right', xs: 'left' } }}
                    >
                      <Typography
                        variant="h3"
                        component="div"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {formatPrice(marketData?.LAST || marketData?.PREVPRICE)}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: { md: 'flex-end', xs: 'flex-start' },
                          gap: 1
                        }}
                      >
                        <Typography
                          variant="h6"
                          color={color}
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          {marketData?.CHANGE > 0 ? '+' : ''}{formatPrice(marketData?.CHANGE)}
                        </Typography>
                        <Typography
                          variant="h6"
                          color={color}
                        >
                          ({formatPercent(marketData?.LASTTOPREVPRICE)})
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid
              item
              xs={12}
            >
              <Grid
                container
                spacing={3}
              >
                <Grid
                  item
                  xs={12}
                  md={8}
                >
                  <Card sx={{ height: '100%' }}>
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
                            <ToggleButton
                              key={p.value}
                              value={p.value}
                            >
                              {isSmallScreen ? p.short : p.label}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      }
                    />
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
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                {(!isSmallScreen || isFutures) && (
                  <Grid
                    item
                    xs={12}
                    md={4}
                  >
                    <Card sx={{ height: '100%' }}>
                      <CardHeader title={isBond ? "Купоны" : (isFund ? "Информация о фонде" : (isCurrency ? "Статистика" : (isFutures ? "О фьючерсе" : "Дивиденды")))} />
                      <Divider />
                      <CardContent>
                        {isBond ? couponsContent : (isFund ? fundContent : (isCurrency ? statsContent : (isFutures ? futuresInfoContent : dividendsContent)))}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
            {!isBond && !isFund && !isCurrency && !isFutures && (
            <Grid
              item
              xs={12}
            >
              <Card>
                <CardHeader
                  title="Ключевые показатели"
                  action={
                    isSmallScreen ? (
                      <MuiTooltip title={tradeDayText}>
                        <IconButton size="small">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </MuiTooltip>
                    ) : (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                      >
                        {tradeDayText}
                      </Typography>
                    )
                  }
                  sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
                />
                <Divider />
                <Box sx={{ px: 2 }}>
                  <Tabs
                    value={detailTab}
                    onChange={handleDetailTabChange}
                    variant="fullWidth"
                  >
                    {keyIndicatorTabs.map((tab) => (
                      <Tab
                        key={tab.value}
                        value={tab.value}
                        label={tab.label}
                      />
                    ))}
                  </Tabs>
                </Box>
                <Divider />
                <CardContent>
                  {detailTab === 'security' && (
                    <Grid
                      container
                      spacing={3}
                    >
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Код ценной бумаги
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.secid || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          ISIN код
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.isin || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Идентификатор режима торгов
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.boardid || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Уровень листинга
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.listLevel || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Режим торгов
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.board_title || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Лотность
                        </Typography>
                        <Typography variant="body1">
                          {formatNumber(lotSize)}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Бумаги для квалифицированных инвесторов
                        </Typography>
                        <Typography variant="body1">
                          {formatYesNo(securityInfo?.isQualifiedInvestors)}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Дата начала торгов
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(securityInfo?.issueDate)}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Полное наименование
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.fullName || securityInfo?.emitentTitle || securityInfo?.shortname || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Допуск к утренней дополнительной торговой сессии
                        </Typography>
                        <Typography variant="body1">
                          {formatYesNo(securityInfo?.morningSession)}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Краткое наименование
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.shortname || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Допуск к вечерней дополнительной торговой сессии
                        </Typography>
                        <Typography variant="body1">
                          {formatYesNo(securityInfo?.eveningSession)}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Номер государственной регистрации
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.regNumber || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Допуск к дополнительной торговой сессии выходного дня
                        </Typography>
                        <Typography variant="body1">
                          {formatYesNo(securityInfo?.weekendSession)}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Номинальная стоимость
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.faceValue != null ? formatPrice(securityInfo.faceValue) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Индикатор &quot;торговые операции разрешены/запрещены&quot;
                        </Typography>
                        <Typography variant="body1">
                          {marketData?.STATUS || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Валюта номинала
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.faceUnit || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Группа инструментов
                        </Typography>
                        <Typography variant="body1">
                          {securityInfo?.groupCode || '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Объем выпуска
                        </Typography>
                        <Typography variant="body1">
                          {formatLargeNumber(securityInfo?.issuesize)}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Дата расчетов сделки
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(marketData?.SETTLEDATE)}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                  {detailTab === 'trading' && (
                    <Grid
                      container
                      spacing={3}
                    >
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Цена закрытия пред. дня
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.close != null ? formatPrice(lastDayStats.close) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Цена открытия
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.open != null ? formatPrice(lastDayStats.open) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Мин. цена
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.low != null ? formatPrice(lastDayStats.low) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Макс. цена
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.high != null ? formatPrice(lastDayStats.high) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Объем сделок за день, руб.
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.value != null ? formatLargeNumber(lastDayStats.value) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Объем сделок за день, шт.
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.volume != null ? formatLargeNumber(lastDayStats.volume) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Цена последней сделки
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.close != null ? formatPrice(lastDayStats.close) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Объем первой сделки
                        </Typography>
                        <Typography variant="body1">
                          -
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Рыночная цена (2)
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.marketPrice2 != null ? formatPrice(lastDayStats.marketPrice2) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Объем последней сделки
                        </Typography>
                        <Typography variant="body1">
                          -
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Рыночная цена (3)
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.marketPrice3 != null ? formatPrice(lastDayStats.marketPrice3) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Сделки для рыночной цены (2)
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.mp2ValTrd != null ? formatLargeNumber(lastDayStats.mp2ValTrd) : '-'}
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >
                          Сделки для рыночной цены (3)
                        </Typography>
                        <Typography variant="body1">
                          {lastDayStats?.mp3TradesValue != null ? formatLargeNumber(lastDayStats.mp3TradesValue) : '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                  {detailTab === 'dividends' && isSmallScreen && !isBond && dividendsContent}
                  {detailTab === 'coupons' && isSmallScreen && isBond && couponsContent}
                  {detailTab === 'stats' && isSmallScreen && isCurrency && statsContent}
                </CardContent>
              </Card>
            </Grid>
            )}
            {!isBond && !isCurrency && !isFutures && (
            <Grid
              item
              xs={12}
            >
              <Card>
                <CardHeader
                  title="Объемы торгов"
                  action={
                    isSmallScreen ? (
                      <MuiTooltip title={tradeDayText}>
                        <IconButton size="small">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </MuiTooltip>
                    ) : (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                      >
                        {tradeDayText}
                      </Typography>
                    )
                  }
                  sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
                />
                <Divider />
                <CardContent>
                  {volumeLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                  {!volumeLoading && volumeError && (
                    <Typography
                      color="error"
                      variant="body2"
                    >
                      {volumeError}
                    </Typography>
                  )}
                  {!volumeLoading && !volumeError && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Рынок</TableCell>
                          <TableCell align="right">Количество сделок</TableCell>
                          <TableCell align="right">Объем сделок, шт.</TableCell>
                          <TableCell align="right">Объем сделок</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.isArray(volumeStats) && volumeStats.length > 0 ? (
                          volumeStats.map((row) => (
                            <TableRow key={row.key}>
                              <TableCell sx={{ fontWeight: row.isTotal ? 600 : 400 }}>
                                {row.label}
                              </TableCell>
                              <TableCell align="right">
                                {row.numTrades != null ? formatLargeNumber(row.numTrades) : '-'}
                              </TableCell>
                              <TableCell align="right">
                                {row.volume != null ? formatLargeNumber(row.volume) : '-'}
                              </TableCell>
                              <TableCell align="right">
                                {row.value != null ? formatLargeNumber(row.value) : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                              <TableCell colSpan={4}>
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  Нет данных за выбранную дату.
                                </Typography>
                              </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default QuoteDetails;
