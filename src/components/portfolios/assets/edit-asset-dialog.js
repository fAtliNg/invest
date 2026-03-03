import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { QuoteLogo } from '../../quote-logo';
import { formatPrice } from '../../../utils/format';

export const EditAssetDialog = ({ open, onClose, onUpdated, uuid, asset }) => {
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldErrors({});
    setQuantity(asset?.quantity != null ? String(asset.quantity) : '');
    setBuyPrice(asset?.buy_price != null ? String(asset.buy_price) : '');
  }, [open, asset]);

  const totalCost = useMemo(() => {
    const q = Number(quantity);
    const p = Number(buyPrice);
    if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p <= 0) return null;
    return q * p;
  }, [quantity, buyPrice]);

  const handleSubmit = async () => {
    const nextErrors = {};
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) nextErrors.quantity = 'Введите количество';
    const p = Number(buyPrice);
    if (!Number.isFinite(p) || p <= 0) nextErrors.buyPrice = 'Введите цену покупки';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!uuid || !asset?.secid) return;

    setSubmitLoading(true);
    setError(null);
    try {
      await axios.put(`/api/portfolios/${uuid}/assets/${asset.secid}`, {
        quantity: q,
        buy_price: p,
        shortname: asset.shortname,
      });
      onUpdated?.();
      onClose?.();
    } catch (e) {
      setError('Не удалось обновить бумагу');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Редактировать бумагу</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          {asset ? <QuoteLogo row={asset} size={32} /> : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.primary" noWrap>
              {asset?.shortname || asset?.secid || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {asset?.secid || ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label="Количество"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            size="small"
            error={Boolean(fieldErrors.quantity)}
            helperText={fieldErrors.quantity || ''}
            fullWidth
            inputProps={{ min: 0, step: 'any' }}
          />
          <TextField
            label="Цена покупки (за штуку)"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            type="number"
            size="small"
            error={Boolean(fieldErrors.buyPrice)}
            helperText={fieldErrors.buyPrice || ''}
            fullWidth
            inputProps={{ min: 0, step: 'any' }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Итоговая стоимость
          </Typography>
          <Typography variant="h6" color="text.primary">
            {totalCost == null ? '-' : formatPrice(totalCost)}
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitLoading}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitLoading || !asset}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

