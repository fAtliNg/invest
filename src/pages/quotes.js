import Head from 'next/head';
import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TableSortLabel, TextField, InputAdornment, SvgIcon, Tabs, Tab, TablePagination } from '@mui/material';
import { Search as SearchIcon } from '../icons/search';
import { DashboardLayout } from '../components/dashboard-layout';
import { useEffect, useState, useRef, useMemo } from 'react';

const VIRTUAL_ROW_HEIGHT = 53;
const VIRTUAL_OVERSCAN = 8;

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [connected, setConnected] = useState(true);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('shortname');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('share');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [virtualMetrics, setVirtualMetrics] = useState({
    scrollY: 0,
    viewportHeight: 0,
    tableTop: 0,
    headerHeight: 0
  });
  const wsRef = useRef(null);
  const tableContainerRef = useRef(null);
  const tableHeadRef = useRef(null);
  const scrollRafRef = useRef(null);

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
        // console.log('WS Message received:', message); // Debug log
        if (message.type === 'QUOTES_UPDATE' && Array.isArray(message.data)) {
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
    if (value === null || value === undefined) return '-';
    
    // For very small numbers (absolute value < 0.1), show more precision
    if (value !== 0 && Math.abs(value) < 0.1) {
      return value.toLocaleString('ru-RU', { 
        style: 'currency', 
        currency: 'RUB',
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      });
    }

    return value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '-';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatNumber = (value) => {
    return value ? value.toLocaleString('ru-RU') : '-';
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleTabChange = (_event, newValue) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];
    
    return quotes.filter((quote) => {
      // Filter by tab type
      if (quote.type !== currentTab) return false;

      // Filter by search query
      const query = searchQuery.toLowerCase();
      return (
        quote.shortname.toLowerCase().includes(query) ||
        quote.secid.toLowerCase().includes(query)
      );
    });
  }, [quotes, currentTab, searchQuery]);

  const sortedQuotes = useMemo(() => {
    return [...filteredQuotes].sort((a, b) => {
      const valueA = a[orderBy];
      const valueB = b[orderBy];

      if (orderBy === 'price') {
        const isANull = !valueA;
        const isBNull = !valueB;

        if (isANull && !isBNull) return 1;
        if (!isANull && isBNull) return -1;
        if (isANull && isBNull) return 0;
      }

      if (valueB < valueA) {
        return order === 'asc' ? 1 : -1;
      }
      if (valueB > valueA) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    });
  }, [filteredQuotes, order, orderBy]);

  const paginatedQuotes = useMemo(() => {
    if (rowsPerPage > 0) {
      return sortedQuotes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }
    return sortedQuotes;
  }, [sortedQuotes, page, rowsPerPage]);

  const shouldVirtualize = paginatedQuotes.length > 200;

  useEffect(() => {
    if (!shouldVirtualize) return;

    const updateMetrics = () => {
      const tableEl = tableContainerRef.current;
      const headEl = tableHeadRef.current;
      const tableTop = tableEl ? tableEl.getBoundingClientRect().top + window.scrollY : 0;
      const headerHeight = headEl ? headEl.getBoundingClientRect().height : VIRTUAL_ROW_HEIGHT;

      setVirtualMetrics({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        tableTop,
        headerHeight
      });
    };

    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        updateMetrics();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateMetrics();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (scrollRafRef.current) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [shouldVirtualize]);

  const { visibleRows, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!shouldVirtualize) {
      return { visibleRows: paginatedQuotes, topSpacerHeight: 0, bottomSpacerHeight: 0 };
    }

    const total = paginatedQuotes.length;
    const totalHeight = total * VIRTUAL_ROW_HEIGHT;
    const bodyTop = virtualMetrics.tableTop + virtualMetrics.headerHeight;
    const viewportTop = virtualMetrics.scrollY;
    const viewportBottom = virtualMetrics.scrollY + virtualMetrics.viewportHeight;
    const visibleStart = Math.max(0, viewportTop - bodyTop);
    const visibleEnd = Math.min(totalHeight, viewportBottom - bodyTop);
    const startIndex = Math.max(0, Math.floor(visibleStart / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
    const endIndex = Math.min(total, Math.ceil(visibleEnd / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN);

    return {
      visibleRows: paginatedQuotes.slice(startIndex, endIndex),
      topSpacerHeight: startIndex * VIRTUAL_ROW_HEIGHT,
      bottomSpacerHeight: (total - endIndex) * VIRTUAL_ROW_HEIGHT
    };
  }, [paginatedQuotes, shouldVirtualize, virtualMetrics]);

  return (
    <>
      <Head>
        <title>Котировки | Profit Case</title>
        <meta name="description" content="Котировки Московской Биржи (MOEX) в режиме реального времени." />
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
                Котировки (MOEX)
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

          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              aria-label="quotes tabs"
            >
              <Tab label="Акции" value="share" />
              <Tab label="Облигации" value="bond" />
              <Tab label="Фонды" value="fund" />
              <Tab label="Валюты" value="currency" />
              <Tab label="Фьючерсы" value="future" />
            </Tabs>
          </Box>

          <TableContainer component={Paper} ref={tableContainerRef}>
            <Table sx={{ minWidth: 650 }} aria-label="quotes table" stickyHeader={shouldVirtualize}>
              <TableHead>
                <TableRow ref={tableHeadRef}>
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
                      active={orderBy === 'volume'}
                      direction={orderBy === 'volume' ? order : 'asc'}
                      onClick={createSortHandler('volume')}
                    >
                      Объем
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'lot_size'}
                      direction={orderBy === 'lot_size' ? order : 'asc'}
                      onClick={createSortHandler('lot_size')}
                    >
                      Лот
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
                {shouldVirtualize && topSpacerHeight > 0 && (
                  <TableRow key="spacer-top" sx={{ height: topSpacerHeight }}>
                    <TableCell colSpan={9} sx={{ p: 0, border: 0 }} />
                  </TableRow>
                )}
                {visibleRows.map((row) => (
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
                    <TableCell align="right">{formatNumber(row.volume)}</TableCell>
                    <TableCell align="right">{formatNumber(row.lot_size)}</TableCell>
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
                {shouldVirtualize && bottomSpacerHeight > 0 && (
                  <TableRow key="spacer-bottom" sx={{ height: bottomSpacerHeight }}>
                    <TableCell colSpan={9} sx={{ p: 0, border: 0 }} />
                  </TableRow>
                )}
                {sortedQuotes.length === 0 && quotes.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Нет данных в этой категории
                    </TableCell>
                  </TableRow>
                )}
                {quotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Загрузка данных...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={sortedQuotes.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[50, 100, 200, 500, { label: 'Все', value: -1 }]}
              labelRowsPerPage="Строк на странице:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count !== -1 ? count : `более чем ${to}`}`}
            />
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
