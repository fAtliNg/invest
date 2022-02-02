import Head from 'next/head';
import { resolve } from '../business/calculator'
import {
  Box,
  Button,
  Container,
  Grid,
} from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { CalcForm } from '../components/calc/calc-form';
import { useState, useEffect } from 'react';
import { PieChart } from '../components/PieChart';
import { BarGraph } from '../components/BarGraph/BarGraph';

const Calc = () => {
  const [values, setValues] = useState({});
  const [result, setResult] = useState({
    initialAmount: 0, // стартовый капитал
    totalReplenishmentAmount: 0, // всего пополнений
    totalPercentAmount: 0, // всего процентов
    passiveIncomePerMonth: 0, // пассивный доход
  });
  const [barGraphValues, setBarGraphValues] = useState({
    initialAmounts: [], // стартовый капитал
    totalReplenishmentAmounts: [], // всего пополнений
    totalPercentAmounts: [], // всего процентов
    passiveIncomePerMonths: [], // пассивный доход
    labels: [],
  });

  const onSubmit = () => {
    const resultElement = document.getElementById('result');
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onCalc();
  }

  const onCalc = () => {
    const results = resolve(values);
    setResult(results.summary);
    setBarGraphValues(results.details);
  }

  useEffect(() => {
    onCalc();
  }, [values]);

  const controls = (
    <Box width="100%" justifyContent="flex-end" display="flex">
      <Button
        color="primary"
        variant="contained"
        onClick={onSubmit}
      >
        Результат
      </Button>
    </Box>
  )

  return (
    <DashboardLayout controls={controls}>
      <Head>
        <title>
          Profit Case
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
                passiveIncomePerMonth={result.passiveIncomePerMonth}
              />
            </Grid>
          </Grid>
          <Grid style={{ marginTop: 16 }}>
            <BarGraph
              initialAmounts={barGraphValues.initialAmounts}
              totalPercentAmounts={barGraphValues.totalPercentAmounts}
              totalReplenishmentAmounts={barGraphValues.totalReplenishmentAmounts}
              labels={barGraphValues.labels}
            />
          </Grid>
        </Container>
      </Box>
    </DashboardLayout>
  )
};

export default Calc;
