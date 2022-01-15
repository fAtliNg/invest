import Head from 'next/head';
import {
  Box, Button, Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  Grid,
  Typography
} from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { CalcForm } from '../components/calc/calc-form';
import { useState } from 'react';

const Calc = () => {
  const [result, setResult] = useState({
    finalBalance: 0, // итоговый баланс
    contribution: 0, // сумма пополнений
    percentAmount: 0, // всего процентов
  });

  const onSubmit = (values) => {
    console.log(values);
    setResult({
      finalBalance: 10000,
      contribution: 7000,
      percentAmount: 3000,
    });
  }

  return (
    <>
      <Head>
        <title>
          Сложный процент
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
              <CalcForm onSubmit={onSubmit}/>
            </Grid>
            <Grid
              item
              lg={7}
              md={6}
              xs={12}
            >
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography
                      color="textPrimary"
                      gutterBottom
                      variant="h5"
                    >
                      {result.finalBalance}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="body2"
                    >
                      Итоговый баланс
                    </Typography>
                  </Box>
                  <Grid
                    container
                    spacing={3}
                  >
                    <Grid
                      item
                      xs={6}
                    >
                      <Box
                        sx={{
                          alignItems: 'center',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Typography
                          color="textPrimary"
                          gutterBottom
                          variant="h5"
                        >
                          {result.contribution}
                        </Typography>
                        <Typography
                          color="textSecondary"
                          variant="body2"
                        >
                          Всего пополнений
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Box
                        sx={{
                          alignItems: 'center',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Typography
                          color="textPrimary"
                          gutterBottom
                          variant="h5"
                        >
                          {result.percentAmount}
                        </Typography>
                        <Typography
                          color="textSecondary"
                          variant="body2"
                        >
                          Всего процентов
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  )
};

Calc.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Calc;
