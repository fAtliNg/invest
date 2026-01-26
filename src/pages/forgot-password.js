import Head from 'next/head';
import NextLink from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Container, Grid, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ForgotPassword = () => {
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Введите корректный email')
        .max(255)
        .required('Email обязателен')
    }),
    onSubmit: async (values, helpers) => {
      // Mock logic as backend support is missing for now
      helpers.setSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Если аккаунт с таким email существует, мы отправили вам ссылку для восстановления.');
      helpers.setSubmitting(false);
    }
  });

  return (
    <>
      <Head>
        <title>Восстановление пароля | Profit Case</title>
      </Head>
      <Box
        component="main"
        sx={{
          display: 'flex',
          flex: '1 1 auto',
          height: '100vh' // Ensure full viewport height
        }}
      >
        <Grid container sx={{ flex: '1 1 auto' }}>
          <Grid
            item
            xs={12}
            lg={7}
            sx={{
              backgroundColor: 'background.default',
              display: {
                xs: 'none',
                lg: 'flex'
              },
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                p: 3
              }}
            >
            </Box>
            <Box
              sx={{
                alignItems: 'flex-start',
                backgroundColor: 'background.default',
                display: 'flex',
                flex: '1 1 auto',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 12,
                py: 3
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: 'text.primary',
                  lineHeight: '32px',
                  mb: 3,
                  textAlign: 'left'
                }}
              >
                Добро пожаловать в Profit Case
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  textAlign: 'left'
                }}
                variant="h6"
              >
                Профессиональный инструмент для инвесторов. Рассчитывайте сложные проценты, управляйте портфелем и достигайте финансовых целей.
              </Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            lg={5}
            sx={{
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '-1px 0 16px rgba(0, 0, 0, 0.08)',
              zIndex: 1
            }}
          >
            <Box
              sx={{
                flex: '1 1 auto',
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                px: 6
              }}
            >
              <Container maxWidth="sm">
                <Typography
                  color="textPrimary"
                  variant="h4"
                  sx={{ mb: 3 }}
                >
                  Восстановление пароля
                </Typography>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  variant="body2"
                  sx={{ mb: 3 }}
                >
                  Введите email для получения ссылки на сброс пароля
                </Typography>
                <form onSubmit={formik.handleSubmit}>
                  <TextField
                    error={Boolean(formik.touched.email && formik.errors.email)}
                    fullWidth
                    helperText={formik.touched.email && formik.errors.email}
                    label="Email адрес"
                    margin="normal"
                    name="email"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="email"
                    value={formik.values.email}
                    variant="outlined"
                    size="small"
                  />
                  <Box sx={{ py: 2 }}>
                    <Button
                      color="primary"
                      disabled={formik.isSubmitting}
                      fullWidth
                      size="large"
                      type="submit"
                      variant="contained"
                      sx={{ height: 40 }}
                    >
                      Отправить ссылку
                    </Button>
                  </Box>
                </form>
              </Container>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default ForgotPassword;
