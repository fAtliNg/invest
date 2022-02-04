import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { EquitiesListResults } from '../components/Equities/EquitiesListResults';
import { EquitiesListToolbar } from '../components/Equities/EquitiesListToolbar';
import { DashboardLayout } from '../components/DashboardLayout';
// import { equities } from '../__mocks__/equities';

const Equities = () => {
  return (
    <DashboardLayout>
      <Head>
        <title>
          Котировки
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth={false}>
          <EquitiesListToolbar />
          <Box sx={{ mt: 3 }}>
            <EquitiesListResults equities={[]} />
          </Box>
        </Container>
      </Box>
    </DashboardLayout>
  );
}

export default Equities;
