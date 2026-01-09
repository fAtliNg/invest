import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import { InputSlider } from '../../components/inputslider';
import { DatePicker } from '@mui/lab';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import ruLocale from 'date-fns/locale/ru';

const periodTypes = [
  {
    value: 'years',
    label: 'Лет'
  },
  {
    value: 'months',
    label: 'Месяцев'
  }
];

export const CreditCalculatorForm = ({ onChangeValues, onOpenEarlyRepayment, ...props }) => {
  const [values, setValues] = useState({
    amount: 1000000,
    term: 5,
    termType: 'years',
    rate: 10,
    startDate: new Date(),
  });

  useEffect(() => {
    onChangeValues(values);
  }, []);

  const handleChange = (event) => {
    const newValues = {
      ...values,
      [event.target.name]: event.target.value
    };
    setValues(newValues);
  };

  const handleDateChange = (newValue) => {
    const newValues = {
      ...values,
      startDate: newValue
    };
    setValues(newValues);
  };

  useEffect(() => {
    onChangeValues(values);
  }, [values]);

  return (
    <form
      autoComplete="off"
      noValidate
      {...props}
      style={{ height: '100%' }}
    >
      <Card style={{ height: '100%' }}>
        <CardHeader
          title="Параметры кредита"
          style={{ padding: "20px 32px" }}
          action={(
            <Button
              variant="outlined"
              onClick={onOpenEarlyRepayment}
              size="small"
            >
              Досрочное погашение
            </Button>
          )}
        />
        <Divider />
        <CardContent>
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              xs={12}
            >
              <InputSlider
                value={values.amount}
                name="amount"
                textFieldProps={{
                  fullWidth: true,
                  label: "Сумма кредита",
                  onChange: handleChange,
                  required: true,
                  variant: "outlined",
                  InputProps: {
                    endAdornment: <InputAdornment position="start">₽</InputAdornment>,
                  },
                  autoFocus: true,
                }}
                sliderProps={{
                  onChange: handleChange,
                  min: 10000,
                  max: 10000000,
                  step: 10000,
                }}
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <InputSlider
                value={values.term}
                name="term"
                textFieldProps={{
                  fullWidth: true,
                  label: "Срок кредита",
                  onChange: handleChange,
                  required: true,
                  variant: "outlined",
                }}
                sliderProps={{
                  onChange: handleChange,
                  min: 1,
                  max: values.termType === 'years' ? 30 : 360,
                  step: 1,
                }}
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Единицы срока"
                name="termType"
                onChange={handleChange}
                required
                select
                SelectProps={{ native: true }}
                value={values.termType}
                variant="outlined"
              >
                {periodTypes.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <InputSlider
                value={values.rate}
                name="rate"
                textFieldProps={{
                  fullWidth: true,
                  label: "Процентная ставка",
                  onChange: handleChange,
                  required: true,
                  variant: "outlined",
                  InputProps: {
                    endAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }
                }}
                sliderProps={{
                  onChange: handleChange,
                  min: 0.1,
                  max: 100,
                  step: 0.1,
                }}
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={ruLocale}>
                <DatePicker
                  label="Дата получения кредита"
                  value={values.startDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </form>
  );
};
