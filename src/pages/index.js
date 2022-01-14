import Head from 'next/head';
import { Box, Container, Grid, Typography } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';

const Main = () => (
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
      </Container>
    </Box>
  </>
);

Main.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Main;
