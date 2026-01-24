import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { EquitiesListResults } from '../components/equities/equities-list-results';
import { EquitiesListToolbar } from '../components/equities/equities-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
import { equities } from '../__mocks__/equities';
import { useEffect, useState } from 'react';

const Equities = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // axios.get('/api/dividends/calendar');
    fetch('/api/dividends/calendar/')
      .then(response => response.json())
      .then(data => setData(data));
  }, [])

  console.log(324, data)

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
            <EquitiesListResults equities={data} />
          </Box>
        </Container>
      </Box>
    </DashboardLayout>
  );
}

export default Equities;
