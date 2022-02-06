import { useState } from 'react';
import Head from 'next/head';
import { Box, Card, CardContent, CardHeader, Container, Divider, Grid } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import { EquitiesListResults } from '../components/Equities/EquitiesListResults';
import { EquitiesListToolbar } from '../components/Equities/EquitiesListToolbar';
import { DashboardLayout } from '../components/DashboardLayout';
import { russian } from '../mock/equities';

const Equities = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [addedSecurities, setAddedSecurities] = useState([]);

  const addSecurity = (item) => {
    setAddedSecurities(addedSecurities.concat(item));
  }

  const removeSecurity = (item) => {
    setAddedSecurities(addedSecurities.filter(i => i.name !== item.name));
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };


  return (
    <DashboardLayout>
      <Head>
        <title>
          Profit Case | Мои портфели
        </title>
      </Head>
      <Grid
        container
        display="flex"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Grid item xs={8}>
          <Container maxWidth={false}>
            <TabContext value={activeTab}>
              <EquitiesListToolbar handleTabChange={handleTabChange}/>
              <Box sx={{ mt: 3 }}>
                <EquitiesListResults
                  equities={russian}
                  addedSecurities={addedSecurities}
                  onAddSecurity={addSecurity}
                  onRemoveSecurity={removeSecurity}
                />
              </Box>
            </TabContext>
          </Container>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardHeader title="Портфель" style={{ padding: "20px 32px" }} />
            <Divider />
            <CardContent>
              <Grid
                container
                spacing={3}
              >
                <Grid
                  item
                  xs={12}
                >
                  sdfsdf
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}

export default Equities;
