import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent, CardHeader,
  Divider,
  Grid,
  TextField,
  InputAdornment
} from '@mui/material';
import { InputSlider } from '../../components/inputslider';

const periods = [
  {
    value: 12,
    label: 'Каждый год'
  },
  {
    value: 6,
    label: 'Каждое полугодие'
  },
  {
    value: 3,
    label: 'Каждый квартал'
  },
  {
    value: 1,
    label: 'Каждый месяц'
  }
];

export const CalcForm = ({ onChangeValues, ...props }) => {
  const [values, setValues] = useState({
    initialAmount: 250000,
    replenishmentAmount: 10000,
    periodAmount: 1,
    percentAmountPerYear: 9,
    numberOfYears: 5,
  });

  useEffect(() => {
    onChangeValues(values);
  }, [onChangeValues, values]);

  const handleChange = (event) => {
    const newValues = {
      ...values,
      [event.target.name]: event.target.value
    };
    setValues(newValues);
  };

  return (
    <form
      autoComplete="off"
      noValidate
      {...props}
    >
      <Card>
        <CardHeader
          title="Данные для расчета"
          style={{ padding: '20px 32px' }}
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
                value={values.initialAmount}
                name="initialAmount"
                textFieldProps={{
                  fullWidth: true,
                  label: "Стартовый капитал",
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
                  min: 0,
                  max: 1000000,
                  step: 1000,
                }}
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <InputSlider
                value={values.replenishmentAmount}
                name="replenishmentAmount"
                textFieldProps={{
                  fullWidth: true,
                  label: "Сумма пополнения",
                  onChange: handleChange,
                  required: true,
                  variant: "outlined",
                  InputProps: {
                    endAdornment: <InputAdornment position="start">₽</InputAdornment>,
                  }
                }}
                sliderProps={{
                  onChange: handleChange,
                  min: 0,
                  max: 100000,
                  step: 1000,
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
                label="Периодичность"
                name="periodAmount"
                onChange={handleChange}
                required
                select
                SelectProps={{ native: true }}
                value={values.periodAmount}
                variant="outlined"
              >
                {periods.map((option) => (
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
                value={values.percentAmountPerYear}
                name="percentAmountPerYear"
                textFieldProps={{
                  fullWidth: true,
                  label: "Доходность в год",
                  onChange: handleChange,
                  required: true,
                  variant: "outlined",
                  InputProps: {
                    endAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }
                }}
                sliderProps={{
                  onChange: handleChange,
                  min: 0,
                  max: 100,
                  step: 1,
                }}
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <InputSlider
                value={values.numberOfYears}
                name="numberOfYears"
                textFieldProps={{
                  fullWidth: true,
                  label: "Продолжительность",
                  onChange: handleChange,
                  required: true,
                  variant: "outlined",
                  InputProps: {
                    endAdornment: <InputAdornment position="start">лет</InputAdornment>,
                  }
                }}
                sliderProps={{
                  onChange: handleChange,
                  min: 0,
                  max: 30,
                  step: 1,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </form>
  );
};
