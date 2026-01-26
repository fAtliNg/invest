import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormHelperText,
  Grid,
  Link,
  TextField,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuthContext } from '../contexts/auth-context';
import { Logo } from '../components/logo';
import { Google as GoogleIcon } from '../icons/google';
import { Vk as VkIcon } from '../icons/vk';

const Register = () => {
  const router = useRouter();
  const { signUp } = useAuthContext();

  const formik = useFormik({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      passwordConfirmation: '',
      policy: false
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Введите корректный email')
        .max(255)
        .required('Email обязателен'),
      firstName: Yup.string()
        .max(255)
        .required('Имя обязательно'),
      lastName: Yup.string()
        .max(255)
        .required('Фамилия обязательна'),
      password: Yup.string()
        .max(255)
        .required('Пароль обязателен')
        .min(6, 'Пароль должен быть не менее 6 символов'),
      passwordConfirmation: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Пароли должны совпадать')
        .required('Подтверждение пароля обязательно'),
      policy: Yup.boolean()
        .oneOf([true], 'Необходимо принять условия использования')
    }),
    onSubmit: async (values, helpers) => {
      try {
        await signUp(values.email, values.password, values.firstName, values.lastName);
        router.push('/');
      } catch (err) {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message || 'Ошибка регистрации' });
        helpers.setSubmitting(false);
      }
    }
  });

  return (
    <>
      <Head>
        <title>Регистрация | Profit Case</title>
      </Head>
      <Box
        component="main"
        sx={{
          display: 'flex',
          flex: '1 1 auto',
          height: '100vh'
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
                   variant="h4"
                   sx={{ mb: 3 }}
                >
                  Регистрация
                </Typography>
                <Typography
                  color="textSecondary"
                  variant="body2"
                >
                  Уже есть аккаунт?
                  {' '}
                  <NextLink
                    href="/login"
                    passHref
                  >
                    <Link
                      variant="subtitle2"
                      underline="hover"
                    >
                      Войти
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
                    Регистрация через Google
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
                    Регистрация через ВКонтакте
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
                  <TextField
                    error={Boolean(formik.touched.firstName && formik.errors.firstName)}
                    fullWidth
                    helperText={formik.touched.firstName && formik.errors.firstName}
                    label="Имя"
                    margin="normal"
                    name="firstName"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.firstName}
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    error={Boolean(formik.touched.lastName && formik.errors.lastName)}
                    fullWidth
                    helperText={formik.touched.lastName && formik.errors.lastName}
                    label="Фамилия"
                    margin="normal"
                    name="lastName"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.lastName}
                    variant="outlined"
                    size="small"
                  />
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
                  <TextField
                    error={Boolean(formik.touched.password && formik.errors.password)}
                    fullWidth
                    helperText={formik.touched.password && formik.errors.password}
                    label="Пароль"
                    margin="normal"
                    name="password"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="password"
                    value={formik.values.password}
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    error={Boolean(formik.touched.passwordConfirmation && formik.errors.passwordConfirmation)}
                    fullWidth
                    helperText={formik.touched.passwordConfirmation && formik.errors.passwordConfirmation}
                    label="Подтвердите пароль"
                    margin="normal"
                    name="passwordConfirmation"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="password"
                    value={formik.values.passwordConfirmation}
                    variant="outlined"
                    size="small"
                  />
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      ml: -1
                    }}
                  >
                    <Checkbox
                      checked={formik.values.policy}
                      name="policy"
                      onChange={formik.handleChange}
                    />
                    <Typography
                      color="textSecondary"
                      variant="body2"
                    >
                      Я прочитал и принимаю{' '}
                      <NextLink
                        href="#"
                        passHref
                      >
                        <Link
                          color="primary"
                          underline="always"
                          variant="subtitle2"
                        >
                          Условия использования
                        </Link>
                      </NextLink>
                    </Typography>
                  </Box>
                  {Boolean(formik.touched.policy && formik.errors.policy) && (
                    <FormHelperText error>
                      {formik.errors.policy}
                    </FormHelperText>
                  )}
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
                      Зарегистрироваться
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

export default Register;
