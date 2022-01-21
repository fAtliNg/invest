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
    initialAmount: 100000,
    replenishmentAmount: 10000,
    periodAmount: 12,
    percentAmountPerYear: 12,
    numberOfYears: 10,
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
    onChangeValues(newValues);
  };

  return (
    <form
      autoComplete="off"
      noValidate
      {...props}
    >
      <Card>
        <CardHeader title="Данные для расчета" />
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
                  helperText: "Сумма денег с которой вы хотели бы начать",
                  label: "Первоначальная сумма",
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
                  helperText: "В указанный период",
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
                  label: "Доходность",
                  helperText: "% годовых",
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
                  helperText: "Количество лет",
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
                  max: 100,
                  step: 1,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider sx={{ display: { xs: 'none', lg: 'block' }}}/>
        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            justifyContent: 'flex-end',
            p: 2
          }}
        >
          <Button
            color="primary"
            variant="contained"
            onClick={() => props.onSubmit({
              ...values,
              periodAmount: parseInt(values.periodAmount)
            })}
          >
            Рассчитать
          </Button>
        </Box>
      </Card>
    </form>
  );
};
