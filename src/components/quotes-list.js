import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TableSortLabel, TextField, InputAdornment, SvgIcon, Tabs, Tab, TablePagination, Avatar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Search as SearchIcon } from '../icons/search';
import { useRouter } from 'next/router';
import { formatPrice, formatPercent, formatNumber } from '../utils/format';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { QuoteLogo } from './quote-logo';
import NextLink from 'next/link';

const VIRTUAL_OVERSCAN = 5;
const TABS = ['share', 'bond', 'fund', 'currency', 'future'];

const PAGE_TITLES = {
  share: 'Акции Московской биржи',
  bond: 'Облигации и ОФЗ',
  fund: 'Фонды (ETF и БПИФ)',
  currency: 'Курсы валют',
  future: 'Фьючерсы'
};

const getFutureCost = (row) => {
  if (row.price && row.min_step && row.step_price) {
    return (row.price / row.min_step) * row.step_price;
  }
  return null;
};



export const QuotesList = (props) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const rowHeight = isMobile ? 72 : 53;
  
  const { secid, type } = router.query;
  const { searchQuery: externalSearchQuery, onSearchChange } = props;
  
  // Initialize tab based on URL or default to 'share'
  const activeParam = type || secid;
  const initialTab = (activeParam && TABS.includes(activeParam)) ? activeParam : 'share';
  const [currentTab, setCurrentTab] = useState(initialTab);
  
  // Sync tab with URL
  useEffect(() => {
    const activeParam = type || secid;
    if (activeParam && TABS.includes(activeParam)) {
      setCurrentTab(activeParam);
      setOrderBy(activeParam === 'future' ? 'secid' : 'shortname');
    }
  }, [secid, type]);

  const [debugMode, setDebugMode] = useState(false);
  const [hiddenQuotes, setHiddenQuotes] = useState(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem('debug_no_icons')) {
      setDebugMode(true);
    }
  }, []);

  const handleIconLoaded = useCallback((secid) => {
    setHiddenQuotes(prev => {
      if (prev.has(secid)) return prev;
      const next = new Set(prev);
      next.add(secid);
      return next;
    });
  }, []);

  const [quotes, setQuotes] = useState([]);
  const [connected, setConnected] = useState(true);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(initialTab === 'future' ? 'secid' : 'shortname');
  
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currencyNames, setCurrencyNames] = useState({});
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
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultUrl =
        window.location.hostname === 'localhost'
          ? 'ws://localhost:5001'
          : `${protocol}//${window.location.host}/api/ws`;
      const isValidEnv =
        wsUrl &&
        /^wss?:\/\//.test(wsUrl) &&
        !/localhost/i.test(wsUrl);
      wsUrl = isValidEnv ? wsUrl : defaultUrl;
    }
    
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

  useEffect(() => {
    const fetchCurrencyNames = async () => {
      try {
        const response = await axios.get('/api/currency-names');
        if (Array.isArray(response.data)) {
          const namesMap = response.data.reduce((acc, item) => {
            acc[item.secid] = item.name;
            return acc;
          }, {});
          setCurrencyNames(namesMap);
        }
      } catch (err) {
        console.error('Failed to fetch currency names', err);
      }
    };
    
    fetchCurrencyNames();
  }, []);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  const handleSearchChange = (event) => {
    if (onSearchChange) {
      onSearchChange(event);
    } else {
      setInternalSearchQuery(event.target.value);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const handleTabChange = (_event, newValue) => {
    setCurrentTab(newValue);
    setPage(0);
    setOrderBy(newValue === 'future' ? 'secid' : 'shortname');
    router.push(`/quotes/${newValue}`);
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
      // Filter by debug mode (hide if icon loaded)
      if (debugMode && hiddenQuotes.has(quote.secid)) return false;

      // Filter by tab type
      if (quote.type !== currentTab) return false;

      // Filter by search query
      const query = searchQuery.toLowerCase();
      return (
        quote.shortname.toLowerCase().includes(query) ||
        quote.secid.toLowerCase().includes(query) ||
        (currencyNames[quote.secid] && currencyNames[quote.secid].toLowerCase().includes(query))
      );
    });
  }, [quotes, currentTab, searchQuery, currencyNames, debugMode, hiddenQuotes]);

  const sortedQuotes = useMemo(() => {
    return [...filteredQuotes].sort((a, b) => {
      let valueA = a[orderBy];
      let valueB = b[orderBy];

      if (orderBy === 'cost') {
        valueA = getFutureCost(a);
        valueB = getFutureCost(b);
      }

      if (orderBy === 'price' || orderBy === 'cost') {
        const isANull = !valueA && valueA !== 0;
        const isBNull = !valueB && valueB !== 0;

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
    if (isMobile) {
      return sortedQuotes;
    }
    if (rowsPerPage > 0) {
      return sortedQuotes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }
    return sortedQuotes;
  }, [sortedQuotes, page, rowsPerPage, isMobile]);

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

  const { visibleRows, topSpacerHeight, bottomSpacerHeight, columnCount } = useMemo(() => {
    if (!shouldVirtualize) {
      const baseColumnCount = 7;
      const extraBondColumns = currentTab === 'bond' ? 2 : 0;
      const extraFutureColumns = currentTab === 'future' ? 1 : 0;
      return { visibleRows: paginatedQuotes, topSpacerHeight: 0, bottomSpacerHeight: 0, columnCount: baseColumnCount + extraBondColumns + extraFutureColumns };
    }

    const total = paginatedQuotes.length;
    const totalHeight = total * rowHeight;
    const bodyTop = virtualMetrics.tableTop + virtualMetrics.headerHeight;
    const viewportTop = virtualMetrics.scrollY;
    const viewportBottom = virtualMetrics.scrollY + virtualMetrics.viewportHeight;
    const visibleStart = Math.max(0, viewportTop - bodyTop);
    const visibleEnd = Math.min(totalHeight, viewportBottom - bodyTop);
    const startIndex = Math.max(0, Math.floor(visibleStart / rowHeight) - VIRTUAL_OVERSCAN);
    const endIndex = Math.min(total, Math.ceil(visibleEnd / rowHeight) + VIRTUAL_OVERSCAN);

    if (currentTab === 'future') {
      return {
        visibleRows: paginatedQuotes.slice(startIndex, endIndex),
        topSpacerHeight: startIndex * rowHeight,
        bottomSpacerHeight: (total - endIndex) * rowHeight,
        columnCount: 4
      };
    }

    const baseColumnCount = 7;
    const extraBondColumns = currentTab === 'bond' ? 2 : 0;
    return {
      visibleRows: paginatedQuotes.slice(startIndex, endIndex),
      topSpacerHeight: startIndex * rowHeight,
      bottomSpacerHeight: (total - endIndex) * rowHeight,
      columnCount: baseColumnCount + extraBondColumns
    };
  }, [paginatedQuotes, shouldVirtualize, virtualMetrics, currentTab, rowHeight]);

  return (
    <Box
      component="main"
      sx={{ flexGrow: 1, py: 8 }}
    >
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
            <Typography
              variant="h4"
              component="h1"
              sx={{ m: 0 }}
            >
              {isMobile ? (PAGE_TITLES[currentTab] || 'Котировки') : (PAGE_TITLES[currentTab] ? `${PAGE_TITLES[currentTab]}` : 'Котировки')}
            </Typography>
            <Chip
              label={connected ? 'Онлайн' : 'Оффлайн'}
              color={connected ? 'success' : 'error'}
              size="small"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
          </Box>

          <Box sx={{ width: { xs: '100%', md: 500 }, display: { xs: 'none', md: 'block' } }}>
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
            <Tab
              label="Акции"
              value="share"
            />
            <Tab
              label="Облигации"
              value="bond"
            />
            <Tab
              label="Фонды"
              value="fund"
            />
            <Tab
              label="Валюты"
              value="currency"
            />
            <Tab
              label="Фьючерсы"
              value="future"
            />
          </Tabs>
        </Box>

        <TableContainer
          component={Paper}
          ref={tableContainerRef}
        >
          <Table
            sx={{ minWidth: { xs: '100%', md: 650 } }}
            aria-label="quotes table"
            stickyHeader={shouldVirtualize}
          >
            <TableHead ref={tableHeadRef}>
              <TableRow>
                {currentTab === 'future' ? (
                  <>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'secid'}
                        direction={orderBy === 'secid' ? order : 'asc'}
                        onClick={createSortHandler('secid')}
                      >
                        Инструмент
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={orderBy === 'cost'}
                        direction={orderBy === 'cost' ? order : 'asc'}
                        onClick={createSortHandler('cost')}
                      >
                        Стоимость
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'price'}
                        direction={orderBy === 'price' ? order : 'asc'}
                        onClick={createSortHandler('price')}
                      >
                        Цена
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={orderBy === 'change_pct'}
                        direction={orderBy === 'change_pct' ? order : 'asc'}
                        onClick={createSortHandler('change_pct')}
                      >
                        Изменение
                      </TableSortLabel>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'shortname'}
                        direction={orderBy === 'shortname' ? order : 'asc'}
                        onClick={createSortHandler('shortname')}
                      >
                        Название
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
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
                        {currentTab === 'currency' ? 'Курс' : (currentTab === 'future' ? 'Цена' : 'Стоимость')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={orderBy === 'high'}
                        direction={orderBy === 'high' ? order : 'asc'}
                        onClick={createSortHandler('high')}
                      >
                        Макс
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={orderBy === 'low'}
                        direction={orderBy === 'low' ? order : 'asc'}
                        onClick={createSortHandler('low')}
                      >
                        Мин
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={orderBy === 'change'}
                        direction={orderBy === 'change' ? order : 'asc'}
                        onClick={createSortHandler('change')}
                      >
                        Изм
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={orderBy === 'change_pct'}
                        direction={orderBy === 'change_pct' ? order : 'asc'}
                        onClick={createSortHandler('change_pct')}
                      >
                        Изм %
                      </TableSortLabel>
                    </TableCell>
                    {currentTab === 'bond' && (
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <TableSortLabel
                          active={orderBy === 'yield'}
                          direction={orderBy === 'yield' ? order : 'asc'}
                          onClick={createSortHandler('yield')}
                        >
                          Доходн. %
                        </TableSortLabel>
                      </TableCell>
                    )}
                    {currentTab === 'bond' && (
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <TableSortLabel
                          active={orderBy === 'matdate'}
                          direction={orderBy === 'matdate' ? order : 'asc'}
                          onClick={createSortHandler('matdate')}
                        >
                          Погашение
                        </TableSortLabel>
                      </TableCell>
                    )}
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {shouldVirtualize && topSpacerHeight > 0 && (
                <TableRow
                  key="spacer-top"
                  sx={{ height: topSpacerHeight }}
                >
                  <TableCell
                    colSpan={columnCount}
                    sx={{ p: 0, border: 0 }}
                  />
                </TableRow>
              )}
              {visibleRows.map((row) => (
                <TableRow
                  hover
                  key={row.secid}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer'
                  }}
                  onClick={() => router.push(`/quotes/${currentTab}/${row.secid}`)}
                >
                  {currentTab === 'future' ? (
                    <>
                      <TableCell>
                        <NextLink href={`/quotes/${currentTab}/${row.secid}`} passHref>
                          <a style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <QuoteLogo row={row} debugMode={debugMode} onIconLoaded={handleIconLoaded} size={isMobile ? 32 : 40} />
                              <Box sx={{ ml: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                                  {row.secid}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.2 }}>
                                  {row.shortname}
                                </Typography>
                              </Box>
                            </Box>
                          </a>
                        </NextLink>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatPrice(getFutureCost(row))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {row.price ? row.price.toLocaleString('ru-RU') : '-'} пт.
                        </Typography>
                        {isMobile && (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, gap: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{ color: row.change >= 0 ? 'success.main' : 'error.main', lineHeight: 1.2 }}
                            >
                              {row.change > 0 ? '+' : ''}{typeof row.change === 'number' ? row.change.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'} пт.
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: row.change_pct >= 0 ? 'success.main' : 'error.main', lineHeight: 1.2 }}
                            >
                              {formatPercent(row.change_pct)}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography
                            variant="body2"
                            sx={{ color: row.change >= 0 ? 'success.main' : 'error.main', lineHeight: 1.2 }}
                          >
                            {row.change > 0 ? '+' : ''}{typeof row.change === 'number' ? row.change.toLocaleString('ru-RU') : '-'} пт.
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: row.change_pct >= 0 ? 'success.main' : 'error.main', lineHeight: 1.2 }}
                          >
                            {formatPercent(row.change_pct)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell
                        component="th"
                        scope="row"
                      >
                          <NextLink href={`/quotes/${currentTab}/${row.secid}`} passHref>
                            <a style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <QuoteLogo row={row} debugMode={debugMode} onIconLoaded={handleIconLoaded} size={isMobile ? 32 : 40} />
                                <Box sx={{ ml: 1.5 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    sx={{ lineHeight: 1.2 }}
                                  >
                                    {currencyNames[row.secid] || row.shortname}
                                  </Typography>
                                  {isMobile && (
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                      {row.secid}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </a>
                          </NextLink>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2">
                          {row.secid}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                            {formatPrice(row.price)}
                          </Typography>
                          {isMobile && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, gap: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: row.change >= 0 ? 'success.main' : 'error.main', lineHeight: 1.2 }}
                              >
                                {row.change > 0 ? '+' : ''}{typeof row.change === 'number' ? row.change.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: row.change_pct >= 0 ? 'success.main' : 'error.main', lineHeight: 1.2 }}
                              >
                                {formatPercent(row.change_pct)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatPrice(row.high)}
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatPrice(row.low)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: row.change >= 0 ? 'success.main' : 'error.main', display: { xs: 'none', md: 'table-cell' } }}
                      >
                        {row.change > 0 ? '+' : ''}{formatPrice(row.change)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: row.change_pct >= 0 ? 'success.main' : 'error.main', display: { xs: 'none', md: 'table-cell' } }}
                      >
                        {formatPercent(row.change_pct)}
                      </TableCell>
                      {currentTab === 'bond' && (
                        <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {typeof row.yield === 'number' ? `${row.yield.toFixed(2)}%` : '—'}
                        </TableCell>
                      )}
                      {currentTab === 'bond' && (
                        <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {row.matdate ? new Date(row.matdate).toLocaleDateString('ru-RU') : '—'}
                        </TableCell>
                      )}
                    </>
                  )}
                </TableRow>
              ))}
              {shouldVirtualize && bottomSpacerHeight > 0 && (
                <TableRow
                  key="spacer-bottom"
                  sx={{ height: bottomSpacerHeight }}
                >
                  <TableCell
                    colSpan={columnCount}
                    sx={{ p: 0, border: 0 }}
                  />
                </TableRow>
              )}
              {sortedQuotes.length === 0 && quotes.length > 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    align="center"
                  >
                    Нет данных в этой категории
                  </TableCell>
                </TableRow>
              )}
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    align="center"
                  >
                    Загрузка данных...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!isMobile && (
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
          )}
        </TableContainer>
      </Container>
    </Box>
  );
};
