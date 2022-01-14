import Head from 'next/head';
import { Box, Container, Grid, Typography } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';

const Strategy = () => (
  <>
    <Head>
      <title>
        Проверка стратегии
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
          Проверка стратегии
        </Typography>
      </Container>
    </Box>
  </>
);

Strategy.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Strategy;
