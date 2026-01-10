import Head from 'next/head';
import { Box, Container, Typography, Grid, Button } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { CreditCalculatorForm } from '../components/credit/credit-calculator-form';
import { CreditScheduleTable } from '../components/credit/credit-schedule-table';
import { CreditSummary } from '../components/credit/credit-summary';
import { CreditBarGraph } from '../components/credit/credit-bar-graph';
import { EarlyRepaymentModal } from '../components/credit/early-repayment-modal';
import { calculateCredit } from '../business/credit-calculator';
import { useState, useEffect } from 'react';
import { getYear, format } from 'date-fns';

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
  const [earlyRepayments, setEarlyRepayments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        values.startDate,
        earlyRepayments
      );

      const scheduleWithoutEarlyRepayment = calculateCredit(
        Number(values.amount),
        Number(values.term),
        values.termType,
        Number(values.rate),
        values.startDate,
        []
      );

      const totalPrincipal = Number(values.amount);
      const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
      const totalInterestWithoutEarlyRepayment = scheduleWithoutEarlyRepayment.reduce((sum, p) => sum + p.interest, 0);
      const totalEarlyRepayment = schedule.filter(p => p.type === 'early_repayment').reduce((sum, p) => sum + p.amount, 0);
      
      setSummary({
        totalAmount: schedule.length,
        totalPayment: totalPrincipal + totalInterest,
        totalPrincipal: totalPrincipal,
        totalInterest: totalInterest,
        totalEarlyRepayment: totalEarlyRepayment,
        savings: Math.max(0, totalInterestWithoutEarlyRepayment - totalInterest)
      });
    }
  }, [values, earlyRepayments]);

  useEffect(() => {
    if (Object.keys(debouncedValues).length > 0) {
      const schedule = calculateCredit(
        Number(debouncedValues.amount),
        Number(debouncedValues.term),
        debouncedValues.termType,
        Number(debouncedValues.rate),
        debouncedValues.startDate,
        earlyRepayments
      );
      setPayments(schedule);

      // Подготовка данных для графика
      let labels = [];
      let principalPayments = [];
      let interestPayments = [];
      let earlyRepaymentPayments = [];
      
      const lastRegular = schedule.filter(p => p.type === 'regular').pop();
      const maxNumber = lastRegular ? lastRegular.number : 0;
      
      if (maxNumber <= 12) {
        // По месяцам - агрегация
        const groups = {};
        schedule.forEach(p => {
            const key = format(p.date, 'yyyy-MM');
            if (!groups[key]) {
                groups[key] = {
                    principal: 0,
                    interest: 0,
                    earlyRepayment: 0,
                    label: p.type === 'regular' ? p.number : null,
                    date: p.date
                };
            }
            if (p.type === 'regular') {
                groups[key].principal += p.principal;
                groups[key].label = p.number;
            } else {
                groups[key].earlyRepayment += p.amount;
            }
            groups[key].interest += p.interest;
        });

        const sortedKeys = Object.keys(groups).sort();
        sortedKeys.forEach(key => {
            const g = groups[key];
            labels.push(g.label || format(g.date, 'MM.yyyy'));
            principalPayments.push(g.principal);
            interestPayments.push(g.interest);
            earlyRepaymentPayments.push(g.earlyRepayment);
        });
      } else {
        // По годам - агрегация
        const groups = {};
        schedule.forEach(p => {
            const year = getYear(p.date);
            if (!groups[year]) {
                groups[year] = {
                    principal: 0,
                    interest: 0,
                    earlyRepayment: 0
                };
            }
            if (p.type === 'regular') {
                groups[year].principal += p.principal;
            } else {
                groups[year].earlyRepayment += p.amount;
            }
            groups[year].interest += p.interest;
        });
        
        Object.keys(groups).sort().forEach(year => {
            labels.push(year);
            principalPayments.push(groups[year].principal);
            interestPayments.push(groups[year].interest);
            earlyRepaymentPayments.push(groups[year].earlyRepayment);
        });
      }
      
      setGraphData({
        labels,
        principalPayments,
        interestPayments,
        earlyRepaymentPayments
      });
    }
  }, [debouncedValues, earlyRepayments]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleAddEarlyRepayment = (repayment) => {
    setEarlyRepayments([...earlyRepayments, repayment]);
  };
  const handleDeleteEarlyRepayment = (id) => {
    setEarlyRepayments(earlyRepayments.filter(item => item.id !== id));
  };

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
              <CreditCalculatorForm 
                onChangeValues={setValues} 
                onOpenEarlyRepayment={handleOpenModal}
              />
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
                totalEarlyRepayment={summary.totalEarlyRepayment}
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
                earlyRepaymentPayments={graphData.earlyRepaymentPayments}
                savings={summary.savings}
              />
            </Grid>
            <Grid
              item
              xs={12}
              id="credit-result-table"
              sx={{ scrollMarginTop: '100px' }}
            >
              <CreditScheduleTable 
                payments={payments} 
                summary={summary} 
                onDeleteEarlyRepayment={handleDeleteEarlyRepayment}
              />
            </Grid>
          </Grid>
        </Container>
        <EarlyRepaymentModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onApply={handleAddEarlyRepayment}
          initialDate={values.startDate || new Date()}
        />
      </Box>
    </DashboardLayout>
  );
};

export default CreditCalculator;
