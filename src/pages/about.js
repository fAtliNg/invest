import Head from 'next/head';
import { Box, Container, Link, Typography, Alert } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';


const About = () => (
  <DashboardLayout>
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
        <Typography
          sx={{ mb: 3 }}
          variant="h4"
        >
          О проекте
        </Typography>
        <Typography
          sx={{ mb: 2 }}
          variant="body1"
        >
          <Link ml={4} href="https://profit-case.ru">Profit-case.ru</Link> - это сервис для планирования и
          тестирования инвестиционных стратегий. Он помогает спрогнозировать рост капитала на основе:
        </Typography>
        <Box ml={6} mb={2}>
          <ul>
            <li>стартового капитала;</li>
            <li>объема и периодичности пополнений;</li>
            <li>продолжительности инвестирования;</li>
            <li>потенциальной доходности портфеля.</li>
          </ul>
        </Box>
        <Box>
          <Typography
            sx={{ mb: 2 }}
            variant="body1"
          >
            Profit Case предоставляет
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

export default About;
