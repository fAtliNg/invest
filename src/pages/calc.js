import Head from 'next/head';
import { resolve } from '../business/calculator'
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DashboardLayout } from '../components/dashboard-layout';
import { CalcForm } from '../components/calc/calc-form';
import { useState, useEffect } from 'react';
import { PieChart } from '../components/PieChart';
import { BarGraph } from '../components/BarGraph/BarGraph';

const Calc = () => {
  const [values, setValues] = useState({});
  const [result, setResult] = useState({
    initialAmount: 0,
    totalReplenishmentAmount: 0,
    totalPercentAmount: 0,
    passiveIncomePerMonth: 0,
  });
  const [barGraphValues, setBarGraphValues] = useState({
    initialAmounts: [],
    totalReplenishmentAmounts: [],
    totalPercentAmounts: [],
    passiveIncomePerMonths: [],
    labels: [],
  });

  const onCalc = () => {
    const results = resolve(values);
    setResult(results.summary);
    setBarGraphValues(results.details);
  };

  useEffect(() => {
    const results = resolve(values);
    setResult(results.summary);
    setBarGraphValues(results.details);
  }, [values]);

  const onSubmit = () => {
    const resultElement = document.getElementById('result');
    if (resultElement) {
      resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onCalc();
  };

  const controls = (
    <Box width="100%" justifyContent="flex-end" display="flex">
      <Button color="primary" variant="contained" onClick={onSubmit}>
        Результат
      </Button>
    </Box>
  );

  return (
    <DashboardLayout controls={controls}>
      <Head>
        <title>Калькулятор сложного процента с пополнением онлайн | Profit Case</title>
        <meta
          name="description"
          content="Бесплатный калькулятор сложного процента с пополнением и реинвестированием. Рассчитайте доходность инвестиций онлайн. Точный прогноз роста капитала от Profit Case."
        />
        <meta name="keywords" content="калькулятор сложного процента, инвестиционный калькулятор, расчет прибыли, реинвестирование, сложный процент онлайн, profit case" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://profit-case.ru/calc" />
        <meta property="og:title" content="Калькулятор сложного процента с пополнением онлайн | Profit Case" />
        <meta property="og:description" content="Бесплатный калькулятор сложного процента с пополнением и реинвестированием. Рассчитайте доходность инвестиций онлайн. Точный прогноз роста капитала от Profit Case." />
        <meta property="og:site_name" content="Profit Case" />
        <meta property="og:locale" content="ru_RU" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://profit-case.ru/calc" />
        <meta name="twitter:title" content="Калькулятор сложного процента с пополнением онлайн | Profit Case" />
        <meta name="twitter:description" content="Бесплатный калькулятор сложного процента с пополнением и реинвестированием. Рассчитайте доходность инвестиций онлайн." />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Калькулятор сложного процента",
              "description": "Инструмент для расчета доходности инвестиций с учетом сложного процента и регулярных пополнений.",
              "url": "https://profit-case.ru/calc",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Any",
              "publisher": {
                "@type": "Organization",
                "name": "Profit Case",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://profit-case.ru/static/logo.svg"
                }
              }
            })
          }}
        />
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="lg">
          <Typography sx={{ mb: 3 }} variant="h4" component="h1">
            Калькулятор сложного процента
          </Typography>
          <Grid container spacing={3}>
            <Grid item lg={5} md={6} xs={12}>
              <CalcForm onSubmit={onSubmit} onChangeValues={(data) => { setValues(data); }} />
            </Grid>
            <Grid item lg={7} md={6} xs={12}>
              <Box id="result">
                <PieChart
                  totalBalance={result.totalBalance}
                  initialAmount={result.initialAmount}
                  totalReplenishmentAmount={result.totalReplenishmentAmount}
                  totalPercentAmount={result.totalPercentAmount}
                  passiveIncomePerMonth={result.passiveIncomePerMonth}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <BarGraph
                initialAmounts={barGraphValues.initialAmounts}
                totalPercentAmounts={barGraphValues.totalPercentAmounts}
                totalReplenishmentAmounts={barGraphValues.totalReplenishmentAmounts}
                labels={barGraphValues.labels}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 8 }}>
            <Typography variant="h4" gutterBottom>
              Формула расчета сложного процента
            </Typography>
            <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Основная формула
              </Typography>
              <Typography variant="body2" color="textSecondary">
                FV = P × (1 + r)^n + A × ((1 + r)^n − 1) / r
              </Typography>
            </Paper>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Пояснения к формуле</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary">
                  P — начальная сумма; r — ставка за период; n — число периодов; A — размер пополнений.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default Calc;
