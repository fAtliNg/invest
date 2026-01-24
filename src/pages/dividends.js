import Head from 'next/head';
import { Box, Container, Link, Typography, Alert } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';


const Dividends = () => (
  <DashboardLayout>
    <Head>
      <title>
        Сервис для инвесторов онлайн Profit Case
      </title>
      <meta
        name="description"
        content="Сервисы для планирования и тестирования инвестиционных стратегий онлайн.
        Калькуляторы для инвесторов Profit Case с удобной визуализацией."
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
          sx={{ mb: 2 }}
          variant="body1"
        >
          <Link
            ml={4}
            href="https://profit-case.ru"
          >
            Profit Case
          </Link> - это сервис для планирования и
          тестирования инвестиционных стратегий. Он помогает спрогнозировать рост капитала на основе
          следующих параметров:
        </Typography>
        <Box
          ml={6}
          mb={2}
        >
          <ul>
            <li>стартовый капитал;</li>
            <li>объем и периодичность пополнений;</li>
            <li>продолжительность инвестирования;</li>
            <li>потенциальная доходность портфеля.</li>
          </ul>
        </Box>
        <Box>
          <Typography
            sx={{ mb: 2 }}
            variant="body1"
          >
            <Link
              ml={4}
              href="/"
            >
              Profit Case
            </Link> предоставляет
            реализацию калькулятора сложного процента с удобной визуализацией результатов расчета и
            динамики роста капитала.
          </Typography>
        </Box>
        <Box mt={3}>
          <Alert severity="info">
            Сложный процент - это реинвестирование доходности портфеля в него же. Это позволяет
            ощутимо увеличивать капитал за счет того, что процент доходности применяется не только к
            сумме вложенных средств, но и к прибыли, полученной за предыдущие периоды.
          </Alert>
        </Box>
      </Container>
    </Box>
  </DashboardLayout>
);

export default Dividends;
