import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TableSortLabel, TextField, InputAdornment, SvgIcon, Tabs, Tab, TablePagination, Avatar } from '@mui/material';
import { Search as SearchIcon } from '../icons/search';
import { useRouter } from 'next/router';
import { formatPrice, formatPercent, formatNumber } from '../utils/format';
import { getIcon } from '../utils/futures-icons';
import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';

const VIRTUAL_ROW_HEIGHT = 53; // approximate row height
const VIRTUAL_OVERSCAN = 5;
const TABS = ['share', 'bond', 'fund', 'currency', 'future'];

const getAvatarColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const getFutureCost = (row) => {
  if (row.price && row.min_step && row.step_price) {
    return (row.price / row.min_step) * row.step_price;
  }
  return null;
};

export const QuotesList = () => {
  const router = useRouter();
  const { secid, type } = router.query;
  
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

  const [quotes, setQuotes] = useState([]);
  const [connected, setConnected] = useState(true);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(initialTab === 'future' ? 'secid' : 'shortname');
  const [searchQuery, setSearchQuery] = useState('');
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
    
    // Если переменная окружения не задана, определяем URL динамически
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // В продакшене (через nginx) вебсокеты доступны по /api/ws
      // При локальной разработке обычно localhost:5001
      if (window.location.hostname === 'localhost') {
        wsUrl = 'ws://localhost:5001';
      } else {
        wsUrl = `${protocol}//${window.location.host}/api/ws`;
      }
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
        let apiUrl = '/api/currency-names';
        if (window.location.hostname === 'localhost') {
            apiUrl = 'http://localhost:5001/api/currency-names';
        }
        
        const response = await axios.get(apiUrl);
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
    setSearchQuery(event.target.value);
    setPage(0);
  };

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
  }, [quotes, currentTab, searchQuery, currencyNames]);

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

  const { visibleRows, topSpacerHeight, bottomSpacerHeight, columnCount } = useMemo(() => {
    if (!shouldVirtualize) {
      const baseColumnCount = 7;
      const extraBondColumns = currentTab === 'bond' ? 2 : 0;
      const extraFutureColumns = currentTab === 'future' ? 1 : 0;
      return { visibleRows: paginatedQuotes, topSpacerHeight: 0, bottomSpacerHeight: 0, columnCount: baseColumnCount + extraBondColumns + extraFutureColumns };
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

    if (currentTab === 'future') {
      return {
        visibleRows: paginatedQuotes.slice(startIndex, endIndex),
        topSpacerHeight: startIndex * VIRTUAL_ROW_HEIGHT,
        bottomSpacerHeight: (total - endIndex) * VIRTUAL_ROW_HEIGHT,
        columnCount: 4
      };
    }

    const baseColumnCount = 7;
    const extraBondColumns = currentTab === 'bond' ? 2 : 0;
    return {
      visibleRows: paginatedQuotes.slice(startIndex, endIndex),
      topSpacerHeight: startIndex * VIRTUAL_ROW_HEIGHT,
      bottomSpacerHeight: (total - endIndex) * VIRTUAL_ROW_HEIGHT,
      columnCount: baseColumnCount + extraBondColumns
    };
  }, [paginatedQuotes, shouldVirtualize, virtualMetrics, currentTab]);

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
              sx={{ m: 0 }}
            >
              Котировки (MOEX)
            </Typography>
            <Chip
              label={connected ? 'Онлайн' : 'Оффлайн'}
              color={connected ? 'success' : 'error'}
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
            sx={{ minWidth: 650 }}
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
                    <TableCell align="right">
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
                    <TableCell align="right">
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
                        {currentTab === 'currency' ? 'Курс' : (currentTab === 'future' ? 'Цена' : 'Стоимость')}
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
                    {currentTab === 'bond' && (
                      <TableCell align="right">
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
                      <TableCell align="right">
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {(() => {
                            const iconUrl = getIcon(row.secid, row.shortname);
                            return iconUrl ? (
                              <Avatar
                                src={iconUrl}
                                sx={{
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                  bgcolor: 'transparent',
                                  '& img': {
                                    objectFit: 'contain'
                                  }
                                }}
                              />
                            ) : (
                              <Avatar
                                sx={{
                                  bgcolor: getAvatarColor(row.secid),
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                  fontSize: '0.875rem'
                                }}
                              >
                                {row.secid.substring(0, 2)}
                              </Avatar>
                            );
                          })()}
                          <Box>
                            <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                              {row.secid}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.2 }}>
                              {row.shortname}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatPrice(getFutureCost(row))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {row.price ? row.price.toLocaleString('ru-RU') : '-'} пт.
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {(() => {
                            const iconUrl = getIcon(row.secid, row.shortname);
                            return iconUrl ? (
                              <Avatar
                                src={iconUrl}
                                sx={{
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                  bgcolor: 'transparent',
                                  '& img': {
                                    objectFit: 'contain'
                                  }
                                }}
                              />
                            ) : (
                              <Avatar
                                sx={{
                                  bgcolor: getAvatarColor(row.secid),
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                  fontSize: '0.875rem'
                                }}
                              >
                                {row.secid.substring(0, 2)}
                              </Avatar>
                            );
                          })()}
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                          >
                            {currencyNames[row.secid] || row.shortname}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.secid}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatPrice(row.price)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPrice(row.high)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPrice(row.low)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: row.change >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {row.change > 0 ? '+' : ''}{formatPrice(row.change)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: row.change_pct >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatPercent(row.change_pct)}
                      </TableCell>
                      {currentTab === 'bond' && (
                        <TableCell align="right">
                          {typeof row.yield === 'number' ? `${row.yield.toFixed(2)}%` : '—'}
                        </TableCell>
                      )}
                      {currentTab === 'bond' && (
                        <TableCell align="right">
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
  );
};
