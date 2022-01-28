import Head from 'next/head';
import { Box, Container, Grid, Typography } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import Card from '@mui/material/Card';

const About = () => (
  <>
    <Head>
      <title>
        О проекте
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
          sx={{ mb: 3 }}
          variant="body1"
        >
          Profit-case.ru представляет собой онлайн-калькулятор сложного процента, который помогает
          спрогнозировать доходность ваших инвестиций на основе стартового капитала с учётом
          процентной ставки, регулярных пополнений и удобного срока расчета. Добавляя свои значения,
          вы получаете прогноз инвестирования в виде круговой диаграммы и гистограммы. Сервис
          рассчитан на ускорение процесса наращивания капитала при вложении денег. Profit-case.ru -
          ваш помощник учёта личных финансов!
        </Typography>
      </Container>
    </Box>
  </>
);

About.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default About;
