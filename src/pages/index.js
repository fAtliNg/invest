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
          Инвестиционный калькулятор сложного процента онлайн Profit Case
        </title>
        <meta
          name="description"
          content="Инвестиционный калькулятор позволяет выполнить бесплатный расчет динамики роста
          капитала онлайн. Калькулятор сложного процента Profit Case с удобной визуализацией."
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
              <CalcForm onSubmit={onSubmit} onChangeValues={(data) => {setValues(data)}} />
            </Grid>
            <Grid
              item
              lg={7}
              md={6}
              xs={12}
            >
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
            <Grid
              item
              xs={12}
            >
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
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                A = P × (1 + r/n)<sup>n×t</sup>
              </Typography>
              <Typography paragraph sx={{ mt: 2 }}>
                Где:
              </Typography>
              <ul style={{ paddingLeft: '20px' }}>
                <li><Typography variant="body1"><strong>A</strong> — итоговая сумма в конце срока.</Typography></li>
                <li><Typography variant="body1"><strong>P</strong> — начальная сумма инвестиций (тело вклада).</Typography></li>
                <li><Typography variant="body1"><strong>r</strong> — годовая процентная ставка (в десятичном виде, например, 0.1 для 10%).</Typography></li>
                <li><Typography variant="body1"><strong>n</strong> — количество периодов капитализации процентов в год (например, 12 для ежемесячной капитализации).</Typography></li>
                <li><Typography variant="body1"><strong>t</strong> — общий срок инвестирования в годах.</Typography></li>
              </ul>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Наш онлайн калькулятор также учитывает регулярные ежемесячные пополнения, используя расширенную формулу аннуитетов для максимально точного прогноза роста вашего капитала.
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ mt: 8 }}>
            <Typography variant="h4" gutterBottom>
              Частые вопросы
            </Typography>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6">Что такое сложный процент?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Сложный процент — это метод расчета дохода, при котором проценты начисляются не только на первоначальную сумму вложений, но и на уже накопленные проценты. Это создает эффект «снежного кома», позволяя капиталу расти экспоненциально с течением времени.
                </Typography>
                <Typography paragraph>
                  В инвестициях сложный процент работает особенно эффективно на длительных горизонтах (от 5-10 лет), значительно увеличивая итоговую доходность портфеля за счет реинвестирования дивидендов и купонов.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography variant="h6">Как пользоваться калькулятором?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  1. Введите <strong>Стартовый капитал</strong> — сумму, с которой вы начинаете инвестировать.
                </Typography>
                <Typography paragraph>
                  2. Укажите <strong>Срок инвестирования</strong> в годах.
                </Typography>
                <Typography paragraph>
                  3. Задайте <strong>Ставку</strong> (ожидаемую годовую доходность).
                </Typography>
                <Typography paragraph>
                  4. Добавьте <strong>Ежемесячное пополнение</strong>, если планируете регулярно вносить средства.
                </Typography>
                <Typography>
                  Калькулятор автоматически построит график роста капитала и покажет итоговую сумму с учетом реинвестирования.
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
