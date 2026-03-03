import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { QuoteLogo } from '../../quote-logo';
import { formatPercent, formatPrice } from '../../../utils/format';

export const PortfolioAssetsTable = ({ uuid, refreshKey = 0, onEdit }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSecids, setSelectedSecids] = useState([]);
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!uuid) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/portfolios/${uuid}/assets`);
        setAssets(Array.isArray(response.data) ? response.data : []);
      } catch {
        setError('Не удалось загрузить состав портфеля');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [uuid, refreshKey, internalRefreshKey]);

  useEffect(() => {
    if (selectedSecids.length === 0) return;
    const available = new Set(assets.map((a) => a.secid));
    const next = selectedSecids.filter((s) => available.has(s));
    if (next.length !== selectedSecids.length) {
      setSelectedSecids(next);
    }
  }, [assets, selectedSecids]);

  const allSecids = assets.map((a) => a.secid);
  const selectedSet = new Set(selectedSecids);
  const isAllSelected = assets.length > 0 && selectedSecids.length === assets.length;
  const isIndeterminate = selectedSecids.length > 0 && selectedSecids.length < assets.length;

  const handleToggleAll = (event) => {
    if (event.target.checked) {
      setSelectedSecids(allSecids);
    } else {
      setSelectedSecids([]);
    }
  };

  const handleToggleOne = (secid) => (event) => {
    const checked = event.target.checked;
    setSelectedSecids((prev) => {
      if (checked) {
        if (prev.includes(secid)) return prev;
        return [...prev, secid];
      }
      return prev.filter((s) => s !== secid);
    });
  };

  const handleDeleteSelected = async () => {
    if (!uuid || selectedSecids.length === 0) return;
    setDeleteLoading(true);
    try {
      await axios.post(`/api/portfolios/${uuid}/assets/delete`, { secids: selectedSecids });
      setSelectedSecids([]);
      setInternalRefreshKey((v) => v + 1);
    } catch {
      setError('Не удалось удалить выбранные бумаги');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  return assets.length === 0 ? (
    <Typography variant="body2" color="textSecondary">
      В портфеле пока нет бумаг.
    </Typography>
  ) : (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 800 }} aria-label="portfolio assets table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                />
              </TableCell>
              <TableCell>Бумага</TableCell>
              <TableCell>Тикер</TableCell>
              <TableCell align="right">Кол-во</TableCell>
              <TableCell align="right">Стоимость покупки</TableCell>
              <TableCell align="right">Текущая стоимость</TableCell>
              <TableCell align="right" sx={{ width: 62, minWidth: 62, maxWidth: 62 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((row) => {
              const purchaseCost = typeof row.purchase_cost === 'number' ? row.purchase_cost : null;
              const currentCost = typeof row.current_cost === 'number' ? row.current_cost : null;
              const absChange = typeof row.change_abs === 'number' ? row.change_abs : null;
              const pct = typeof row.change_pct === 'number' ? row.change_pct : null;
              const changeColor =
                typeof absChange === 'number'
                  ? absChange >= 0
                    ? 'success.main'
                    : 'error.main'
                  : 'text.secondary';
              const changeStr =
                absChange == null ? '-' : `${absChange > 0 ? '+' : ''}${formatPrice(absChange)}`;
              const pctStr = formatPercent(pct);

              return (
                <TableRow key={row.secid} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={selectedSet.has(row.secid)}
                      onChange={handleToggleOne(row.secid)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <QuoteLogo row={row} size={36} />
                      <Typography variant="body2" color="text.primary">
                        {row.shortname || row.secid}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.secid}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{row.quantity}</TableCell>
                  <TableCell align="right">{formatPrice(purchaseCost)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.primary">
                      {formatPrice(currentCost)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: changeColor }}>
                      {changeStr} ({pctStr})
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ width: 62, minWidth: 62, maxWidth: 62, whiteSpace: 'nowrap' }}>
                    <IconButton size="small" onClick={() => onEdit?.(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={selectedSecids.length > 0}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={`Выбрано: ${selectedSecids.length}`}
        action={
          <>
            <Button size="small" color="inherit" onClick={() => setSelectedSecids([])} disabled={deleteLoading}>
              Отмена
            </Button>
            <Button size="small" color="error" onClick={handleDeleteSelected} disabled={deleteLoading}>
              Удалить
            </Button>
          </>
        }
      />
    </>
  );
};
