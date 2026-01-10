import Head from 'next/head';
import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TableSortLabel, TextField, InputAdornment, SvgIcon } from '@mui/material';
import { Search as SearchIcon } from '../icons/search';
import { DashboardLayout } from '../components/dashboard-layout';
import { useEffect, useState, useRef } from 'react';

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [connected, setConnected] = useState(true);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('shortname');
  const [searchQuery, setSearchQuery] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    // Note: Adjust URL for production
    const wsUrl = 'ws://localhost:5001'; 
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WS');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WS Message received:', message); // Debug log
        if (message.type === 'QUOTES_UPDATE') {
          setQuotes(message.data);
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WS');
      setConnected(false);
      // Optional: Implement reconnection logic here
    };

    ws.onerror = (error) => {
      console.error('WS Error:', error);
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const formatPrice = (value) => {
    return value ? value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : '-';
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '-';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property) => (event) => {
    handleRequestSort(property);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredQuotes = quotes.filter((quote) => {
    const query = searchQuery.toLowerCase();
    return (
      quote.shortname.toLowerCase().includes(query) ||
      quote.secid.toLowerCase().includes(query)
    );
  });

  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    const valueA = a[orderBy];
    const valueB = b[orderBy];

    if (valueB < valueA) {
      return order === 'asc' ? 1 : -1;
    }
    if (valueB > valueA) {
      return order === 'asc' ? -1 : 1;
    }
    return 0;
  });

  return (
    <>
      <Head>
        <title>Котировки акций | Profit Case</title>
        <meta name="description" content="Котировки акций Московской Биржи (MOEX) в режиме реального времени." />
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 2
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: { xs: 'space-between', md: 'flex-start' },
                gap: 2
              }}
            >
              <Typography variant="h4" sx={{ m: 0 }}>
                Котировки акций (MOEX)
              </Typography>
              <Chip 
                 label={connected ? "Онлайн" : "Оффлайн"} 
                 color={connected ? "success" : "error"} 
                 size="small" 
               />
            </Box>

            <Box sx={{ width: { xs: '100%', md: 500 } }}>
              <TextField
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SvgIcon
                        color="action"
                        fontSize="small"
                      >
                        <SearchIcon />
                      </SvgIcon>
                    </InputAdornment>
                  )
                }}
                onChange={handleSearchChange}
                placeholder="Поиск по названию или тикеру"
                variant="outlined"
              />
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="quotes table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'shortname'}
                      direction={orderBy === 'shortname' ? order : 'asc'}
                      onClick={createSortHandler('shortname')}
                    >
                      Название
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'secid'}
                      direction={orderBy === 'secid' ? order : 'asc'}
                      onClick={createSortHandler('secid')}
                    >
                      Тикер
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'price'}
                      direction={orderBy === 'price' ? order : 'asc'}
                      onClick={createSortHandler('price')}
                    >
                      Стоимость
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'high'}
                      direction={orderBy === 'high' ? order : 'asc'}
                      onClick={createSortHandler('high')}
                    >
                      Макс
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'low'}
                      direction={orderBy === 'low' ? order : 'asc'}
                      onClick={createSortHandler('low')}
                    >
                      Мин
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'change'}
                      direction={orderBy === 'change' ? order : 'asc'}
                      onClick={createSortHandler('change')}
                    >
                      Изм
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'change_pct'}
                      direction={orderBy === 'change_pct' ? order : 'asc'}
                      onClick={createSortHandler('change_pct')}
                    >
                      Изм %
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedQuotes.map((row) => (
                  <TableRow
                    key={row.secid}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {row.shortname}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.secid}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatPrice(row.price)}</TableCell>
                    <TableCell align="right">{formatPrice(row.high)}</TableCell>
                    <TableCell align="right">{formatPrice(row.low)}</TableCell>
                    <TableCell align="right" sx={{ color: row.change >= 0 ? 'success.main' : 'error.main' }}>
                      {row.change > 0 ? '+' : ''}{row.change}
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.change_pct >= 0 ? 'success.main' : 'error.main' }}>
                      {formatPercent(row.change_pct)}
                    </TableCell>
                  </TableRow>
                ))}
                {quotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Загрузка данных...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>
    </>
  );
};

Quotes.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Quotes;
