import Head from 'next/head';
import { resolve } from '../business/calculator'
import {
  Box, Button, Card,
  CardContent,
  Container,
  Grid,
  Typography
} from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { CalcForm } from '../components/calc/calc-form';
import { useState } from 'react';
import { PieChart } from '../components/PieChart';

const Calc = () => {
  const [values, setValues] = useState({});
  const [result, setResult] = useState({
    initialAmount: 0, // стартовый капитал
    totalReplenishmentAmount: 0, // всего пополнений
    totalPercentAmount: 0, // всего процентов
  });

  const onSubmit = () => {
    const resultElement = document.getElementById('result');
    const offsetTop = resultElement.offsetTop - 50;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    // resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const results = resolve(values);
    setResult(results);
  }

  const controls = (
    <Box width="100%" justifyContent="flex-end" display="flex">
      <Button
        color="primary"
        variant="contained"
        onClick={onSubmit}
      >
        Рассчитать
      </Button>
    </Box>
  )

  return (
    <DashboardLayout controls={controls}>
      <Head>
        <title>
          Сложный процент
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              lg={5}
              md={6}
              xs={12}
            >
              <CalcForm onSubmit={onSubmit} onChangeValues={(data) => {setValues(data)}} />
            </Grid>
            <Grid
              item
              lg={7}
              md={6}
              xs={12}
              id="result"
            >
              <PieChart
                totalBalance={result.totalBalance}
                initialAmount={result.initialAmount}
                totalReplenishmentAmount={result.totalReplenishmentAmount}
                totalPercentAmount={result.totalPercentAmount}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </DashboardLayout>
  )
};

export default Calc;
