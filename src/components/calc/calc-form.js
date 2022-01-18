import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent, CardHeader,
  Divider,
  Grid,
  TextField
} from '@mui/material';

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

export const CalcForm = (props) => {
  const [values, setValues] = useState({
    initialAmount: 100000,
    replenishmentAmount: 10000,
    periodAmount: 12,
    percentAmountPerYear: 12,
    numberOfYears: 10,
  });

  const handleChange = (event) => {
    setValues({
      ...values,
      [event.target.name]: event.target.value
    });
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
              <TextField
                fullWidth
                helperText="Сумма денег с которой вы хотели бы начать"
                label="Первоначальная сумма"
                name="initialAmount"
                onChange={handleChange}
                required
                value={values.initialAmount}
                variant="outlined"
                type="number"
                autoFocus
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Сумма пополнения"
                name="replenishmentAmount"
                onChange={handleChange}
                required
                value={values.replenishmentAmount}
                variant="outlined"
                type="number"
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
              <TextField
                fullWidth
                helperText="% годовых"
                label="Доходность"
                name="percentAmountPerYear"
                onChange={handleChange}
                required
                value={values.percentAmountPerYear}
                variant="outlined"
                type="number"
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                helperText="Количество лет"
                label="Продолжительность"
                name="numberOfYears"
                onChange={handleChange}
                required
                value={values.numberOfYears}
                variant="outlined"
                type="number"
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <Box
          sx={{
            display: 'flex',
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
