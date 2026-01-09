import Head from 'next/head';
import { Box, Container, Typography, Grid, Button } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { CreditCalculatorForm } from '../components/credit/credit-calculator-form';
import { CreditScheduleTable } from '../components/credit/credit-schedule-table';
import { CreditSummary } from '../components/credit/credit-summary';
import { CreditBarGraph } from '../components/credit/credit-bar-graph';
import { calculateCredit } from '../business/credit-calculator';
import { useState, useEffect } from 'react';
import { getYear } from 'date-fns';

const CreditCalculator = () => {
  const [values, setValues] = useState({});
  const [debouncedValues, setDebouncedValues] = useState({});
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPayment: 0,
    totalPrincipal: 0,
    totalInterest: 0
  });
  const [graphData, setGraphData] = useState({
    principalPayments: [],
    interestPayments: [],
    labels: []
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValues(values);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [values]);

  useEffect(() => {
    if (Object.keys(values).length > 0) {
      const schedule = calculateCredit(
        Number(values.amount),
        Number(values.term),
        values.termType,
        Number(values.rate),
        values.startDate
      );

      const totalPrincipal = Number(values.amount);
      const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
      
      setSummary({
        totalAmount: schedule.length,
        totalPayment: totalPrincipal + totalInterest,
        totalPrincipal: totalPrincipal,
        totalInterest: totalInterest
      });
    }
  }, [values]);

  useEffect(() => {
    if (Object.keys(debouncedValues).length > 0) {
      const schedule = calculateCredit(
        Number(debouncedValues.amount),
        Number(debouncedValues.term),
        debouncedValues.termType,
        Number(debouncedValues.rate),
        debouncedValues.startDate
      );
      setPayments(schedule);

      // Подготовка данных для графика
      let labels = [];
      let principalPayments = [];
      let interestPayments = [];
      
      const totalMonths = schedule.length;
      
      if (totalMonths <= 12) {
        // По месяцам
        schedule.forEach(p => {
          labels.push(p.number);
          principalPayments.push(p.principal);
          interestPayments.push(p.interest);
        });
      } else {
        // По годам
        let currentYear = getYear(debouncedValues.startDate);
        let yearPrincipal = 0;
        let yearInterest = 0;
        let lastYear = getYear(schedule[0].date);

        schedule.forEach((p, index) => {
          const paymentYear = getYear(p.date);
          
          if (paymentYear !== lastYear) {
            labels.push(lastYear);
            principalPayments.push(yearPrincipal);
            interestPayments.push(yearInterest);
            
            lastYear = paymentYear;
            yearPrincipal = 0;
            yearInterest = 0;
          }
          
          yearPrincipal += p.principal;
          yearInterest += p.interest;
          
          if (index === schedule.length - 1) {
            labels.push(lastYear);
            principalPayments.push(yearPrincipal);
            interestPayments.push(yearInterest);
          }
        });
      }
      
      setGraphData({
        labels,
        principalPayments,
        interestPayments
      });
    }
  }, [debouncedValues]);

  const handleScrollToResult = () => {
    const resultElement = document.getElementById('credit-result-table');
    if (resultElement) {
      resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const controls = (
    <Box width="100%" justifyContent="flex-end" display="flex">
      <Button
        color="primary"
        variant="contained"
        onClick={handleScrollToResult}
      >
        Результат
      </Button>
    </Box>
  );

  return (
    <DashboardLayout controls={controls}>
      <Head>
        <title>
          Кредитный калькулятор | Profit Case
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
            Кредитный калькулятор
          </Typography>
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              lg={6}
              md={6}
              xs={12}
            >
              <CreditCalculatorForm onChangeValues={setValues} />
            </Grid>
            <Grid
              item
              lg={6}
              md={6}
              xs={12}
            >
              <CreditSummary 
                totalAmount={summary.totalAmount}
                totalPayment={summary.totalPayment}
                totalPrincipal={summary.totalPrincipal}
                totalInterest={summary.totalInterest}
              />
            </Grid>
            <Grid
              item
              xs={12}
            >
              <CreditBarGraph 
                labels={graphData.labels}
                principalPayments={graphData.principalPayments}
                interestPayments={graphData.interestPayments}
              />
            </Grid>
            <Grid
              item
              xs={12}
              id="credit-result-table"
              sx={{ scrollMarginTop: '100px' }}
            >
              <CreditScheduleTable payments={payments} summary={summary} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default CreditCalculator;
