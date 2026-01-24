import Head from 'next/head';
import { Box, Container } from '@mui/material';
// import { EquitiesListResults } from '../components/equities/customer-list-results';
// import { EquitiesListToolbar } from '../components/equities/customer-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
// import { equities } from '../__mocks__/customers';

const Customers = () => (
  <>
    <Head>
      <title>
        Customers | Profit Case
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
        {/*<EquitiesListToolbar />*/}
        <Box sx={{ mt: 3 }}>
          {/*<EquitiesListResults customers={equities} />*/}
        </Box>
      </Container>
    </Box>
  </>
);
Customers.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Customers;
