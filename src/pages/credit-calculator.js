import Head from 'next/head';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    earlyRepaymentPayments: [],
    labels: []
  });
  const [earlyRepayments, setEarlyRepayments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setPayments(schedule);

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
            labels.push(g.label || format(g.date, 'LLLL yyyy', { locale: require('date-fns/locale/ru') }));
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
  }, [values, earlyRepayments]);

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
    <Box
      width="100%"
      justifyContent="flex-end"
      display="flex"
    >
      <Button
        color="primary"
        variant="contained"
        onClick={handleScrollToResult}
      >
        Результат
      </Button>
    </Box>
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": "Кредитный калькулятор Profit Case",
    "description": "Онлайн калькулятор кредита с расчетом досрочного погашения, графика платежей и переплаты.",
    "brand": {
      "@type": "Brand",
      "name": "Profit Case"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "RUB"
    },
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web"
  };

  return (
    <DashboardLayout controls={controls}>
      <Head>
        <title>
          Кредитный калькулятор онлайн с досрочным погашением | Profit Case
        </title>
        <meta
          name="description"
          content="Бесплатный кредитный калькулятор онлайн. Рассчитайте ежемесячный платеж, переплату и график выплат с учетом досрочных погашений. Удобный и точный расчет."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
            variant="h1"
            style={{ fontSize: '2rem', fontWeight: 600 }}
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

          <Box sx={{ mt: 8 }}>
            <Typography
              variant="h4"
              gutterBottom
            >
              Полезная информация
            </Typography>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6">Как работает досрочное погашение?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  <strong>Досрочное погашение</strong> позволяет значительно уменьшить общую переплату по кредиту. Вы можете вносить дополнительные суммы сверх ежемесячного платежа, которые пойдут напрямую на погашение основного долга.
                </Typography>
                <Typography paragraph>
                  Существует два основных типа досрочного погашения:
                </Typography>
                <ul>
                  <li><Typography><strong>Уменьшение срока</strong> — позволяет быстрее закрыть кредит, сохраняя размер платежа.</Typography></li>
                  <li><Typography><strong>Уменьшение суммы платежа</strong> — снижает ежемесячную финансовую нагрузку, сохраняя срок кредита.</Typography></li>
                </ul>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography variant="h6">Что такое аннуитетный платеж?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Аннуитетный платеж — это вариант выплат, при котором вы каждый месяц платите одинаковую сумму. В начале срока большую часть платежа составляют проценты, а к концу — основной долг. Это наиболее распространенный вид платежей в российских банках.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
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
