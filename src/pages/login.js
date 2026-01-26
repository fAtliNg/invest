import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Container, Divider, Grid, Link, TextField, Typography } from '@mui/material';
import { useAuthContext } from '../contexts/auth-context';
import { useEffect } from 'react';
import { Logo } from '../components/logo';
import { Google as GoogleIcon } from '../icons/google';
import { Vk as VkIcon } from '../icons/vk';

const Login = () => {
  const router = useRouter();
  const { signIn, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Введите корректный email')
        .max(255)
        .required('Email обязателен'),
      password: Yup.string()
        .max(255)
        .required('Пароль обязателен')
    }),
    onSubmit: async (values, helpers) => {
      console.log('Login form submitted', values);
      try {
        await signIn(values.email, values.password);
        localStorage.setItem('email', values.email);
        router.push('/');
      } catch (err) {
        console.error('Login error', err);
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message || 'Ошибка входа' });
        helpers.setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('email');
    if (savedEmail) {
      formik.setFieldValue('email', savedEmail);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Вход | Profit Case</title>
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
              {/* Logo removed from here to match original design */}
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
                   variant="h4"
                   sx={{ mb: 3 }}
                >
                  Вход
                </Typography>
                <Typography
                  color="textSecondary"
                  variant="body2"
                >
                  Нет аккаунта?
                  {' '}
                  <NextLink
                    href="/register"
                    passHref
                  >
                    <Link
                      variant="subtitle2"
                      underline="hover"
                    >
                      Зарегистрироваться
                    </Link>
                  </NextLink>
                </Typography>
                <Box
                  sx={{
                    pb: 1,
                    pt: 3
                  }}
                >
                  <Button
                    color="inherit"
                    fullWidth
                    startIcon={<GoogleIcon />}
                    onClick={() => {}}
                    size="large"
                    variant="outlined"
                    sx={{
                      mb: 1,
                      height: 40,
                      borderColor: '#D1D5DB',
                      '&:hover': {
                        borderColor: '#9CA3AF'
                      }
                    }}
                  >
                    Войти через Google
                  </Button>
                  <Button
                    color="inherit"
                    fullWidth
                    startIcon={<VkIcon />}
                    onClick={() => {}}
                    size="large"
                    variant="outlined"
                    sx={{
                      height: 40,
                      borderColor: '#D1D5DB',
                      '&:hover': {
                        borderColor: '#9CA3AF'
                      }
                    }}
                  >
                    Войти через ВКонтакте
                  </Button>
                </Box>
                <Box
                  sx={{
                    pb: 3,
                    pt: 1
                  }}
                >
                  <Divider>
                    <Typography variant="body2" color="textSecondary">
                      или
                    </Typography>
                  </Divider>
                </Box>
                <form onSubmit={formik.handleSubmit}>
                  <Box sx={{ my: 3 }}>
                    <Typography
                      color="textPrimary"
                      variant="subtitle2"
                      sx={{ mb: 1, fontWeight: 'bold' }}
                    >
                      Email адрес
                    </Typography>
                    <TextField
                      error={Boolean(formik.touched.email && formik.errors.email)}
                      fullWidth
                      helperText={formik.touched.email && formik.errors.email}
                      name="email"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      type="email"
                      value={formik.values.email}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      color="textPrimary"
                      variant="subtitle2"
                      sx={{ mb: 1, fontWeight: 'bold' }}
                    >
                      Пароль
                    </Typography>
                    <TextField
                      error={Boolean(formik.touched.password && formik.errors.password)}
                      fullWidth
                      helperText={formik.touched.password && formik.errors.password}
                      name="password"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      type="password"
                      value={formik.values.password}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
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
                      Войти
                    </Button>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      mt: 2
                    }}
                  >
                     <NextLink href="/forgot-password" passHref>
                        <Link variant="body2" color="primary" underline="hover">
                          Забыли пароль?
                        </Link>
                     </NextLink>
                  </Box>
                  {formik.errors.submit && (
                    <Box sx={{ mt: 3 }}>
                      <FormHelperText error>
                        {formik.errors.submit}
                      </FormHelperText>
                    </Box>
                  )}
                </form>
              </Container>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Login;
