import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { QuoteLogo } from '../../quote-logo';
import { formatPrice } from '../../../utils/format';

export const AddAssetDialog = ({ open, onClose, onAdded, uuid }) => {
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const [paper, setPaper] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    let active = true;
    const handler = setTimeout(async () => {
      try {
        setQuotesLoading(true);
        setQuotesError(null);
        const response = await axios.get('/api/quotes', {
          params: { q: inputValue || '', limit: 100 }
        });
        if (!active) return;
        setQuotes(Array.isArray(response.data) ? response.data : []);
      } catch (e) {
        if (!active) return;
        setQuotesError('Не удалось загрузить список бумаг');
      } finally {
        if (active) setQuotesLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [open, inputValue]);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
  }, [open]);

  const totalCost = useMemo(() => {
    const q = Number(quantity);
    const p = Number(buyPrice);
    if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p <= 0) return null;
    return q * p;
  }, [quantity, buyPrice]);

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!paper) nextErrors.paper = 'Выберите бумагу';
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) nextErrors.quantity = 'Введите количество';
    const p = Number(buyPrice);
    if (!Number.isFinite(p) || p <= 0) nextErrors.buyPrice = 'Введите цену покупки';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!uuid) return;

    setSubmitLoading(true);
    try {
      await axios.post(`/api/portfolios/${uuid}/assets`, {
        secid: paper.secid,
        shortname: paper.shortname,
        quantity: q,
        buy_price: p,
      });
      onAdded?.();
      onClose?.();
      setPaper(null);
      setQuantity('');
      setBuyPrice('');
    } catch (e) {
      setQuotesError('Не удалось добавить бумагу в портфель');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить бумагу</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Autocomplete
            value={paper}
            onChange={(_e, value) => setPaper(value)}
            options={quotes}
            loading={quotesLoading}
            inputValue={inputValue}
            onInputChange={(_e, value) => setInputValue(value)}
            filterOptions={(x) => x}
            isOptionEqualToValue={(option, value) => option.secid === value.secid}
            getOptionLabel={(option) => `${option.shortname || option.secid} (${option.secid})`}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                <QuoteLogo row={option} size={28} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.primary" noWrap>
                    {option.shortname || option.secid}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.secid}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Бумага"
                placeholder="Начните вводить название или тикер"
                error={Boolean(fieldErrors.paper)}
                helperText={fieldErrors.paper || ''}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {quotesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                size="small"
                fullWidth
              />
            )}
          />
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

        {quotesError && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="error">
              {quotesError}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitLoading}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitLoading || quotesLoading}>
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
};
