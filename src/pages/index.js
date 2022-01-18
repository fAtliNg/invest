import Head from 'next/head';
import { resolve } from '../business/calculator'
import {
  Box, Card,
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
  const [result, setResult] = useState({
    initialAmount: 0, // стартовый капитал
    totalReplenishmentAmount: 0, // всего пополнений
    totalPercentAmount: 0, // всего процентов
  });

  const onSubmit = (values) => {
    console.log(values);
    const resultElement = document.getElementById('result');
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const results = resolve(values);
    console.log(results);
    setResult(results);
  }

  return (
    <>
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
          <Typography
            sx={{ mb: 3 }}
            variant="h4"
          >
            Сложный процент
          </Typography>
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
              <CalcForm onSubmit={onSubmit}/>
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
    </>
  )
};

Calc.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Calc;
