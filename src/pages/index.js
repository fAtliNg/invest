import Head from 'next/head';
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
    finalBalance: 0, // итоговый баланс
    contribution: 0, // сумма пополнений
    percentAmount: 0, // всего процентов
  });

  const onSubmit = (values) => {
    console.log(values);
    setResult({
      finalBalance: 10000,
      contribution: 7000,
      percentAmount: 3000,
    });
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
            >
              <PieChart finalBalance={result.finalBalance} contribution={result.contribution} percentAmount={result.percentAmount}/>
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
