import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Grid,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import ruLocale from 'date-fns/locale/ru';
import { InputSlider } from '../inputslider';

const frequencies = [
  { value: 'once', label: 'Единовременно' },
  { value: '1_month', label: 'Раз в месяц' },
  { value: '2_months', label: 'Раз в 2 месяца' },
  { value: '3_months', label: 'Раз в 3 месяца' },
  { value: '4_months', label: 'Раз в 4 месяца' },
  { value: '6_months', label: 'Раз в полгода' },
  { value: '9_months', label: 'Раз в 9 месяцев' },
  { value: '12_months', label: 'Раз в год' },
];

const recalcTypes = [
  { value: 'reduce_payment', label: 'Уменьшить месячный платеж' },
  { value: 'reduce_term', label: 'Уменьшить срок' },
];

export const EarlyRepaymentModal = ({ open, onClose, onApply, initialDate }) => {
  const [values, setValues] = useState({
    frequency: 'once',
    date: new Date(),
    recalcType: 'reduce_payment',
    amount: 10000,
  });

  useEffect(() => {
    if (open && initialDate) {
        setValues(prev => ({ ...prev, date: initialDate }));
    }
  }, [open, initialDate]);

  const handleChange = (event) => {
    setValues({
      ...values,
      [event.target.name]: event.target.value
    });
  };

  const handleDateChange = (newValue) => {
    setValues({
      ...values,
      date: newValue
    });
  };

  const handleSliderChange = (event, newValue) => {
    setValues({
      ...values,
      amount: newValue
    });
  };

  const handleApply = () => {
    onApply({
      ...values,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Досрочное погашение</DialogTitle>
      <DialogContent>
        <Grid
          container
          spacing={3}
          sx={{ mt: 0 }}
        >
          <Grid
            item
            xs={12}
          >
            <TextField
              fullWidth
              label="Периодичность"
              name="frequency"
              onChange={handleChange}
              select
              value={values.frequency}
              variant="outlined"
            >
              {frequencies.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid
            item
            xs={12}
          >
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              locale={ruLocale}
            >
              <DatePicker
                label="Дата"
                value={values.date}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid
            item
            xs={12}
          >
            <TextField
              fullWidth
              label="Пересчет графика"
              name="recalcType"
              onChange={handleChange}
              select
              value={values.recalcType}
              variant="outlined"
            >
              {recalcTypes.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid
            item
            xs={12}
          >
            <InputSlider
                value={values.amount}
                name="amount"
                textFieldProps={{
                  fullWidth: true,
                  label: "Сумма",
                  onChange: handleChange,
                  required: true,
                  variant: "outlined",
                  InputProps: {
                    endAdornment: <InputAdornment position="start">₽</InputAdornment>,
                  }
                }}
                sliderProps={{
                  onChange: handleSliderChange,
                  min: 1000,
                  max: 10000000,
                  step: 1000,
                }}
              />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Отмена
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
};
