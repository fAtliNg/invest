import { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuthContext } from '../../contexts/auth-context';

export const AccountProfileDetails = (props) => {
  const { user, updateProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (user) {
      setValues({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || ''
      });
    }
  }, [user]);

  const handleChange = (event) => {
    setValues({
      ...values,
      [event.target.name]: event.target.value
    });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await updateProfile(values);
      setNotification({
        open: true,
        message: 'Профиль обновлен',
        severity: 'success'
      });
    } catch (err) {
      console.error(err);
      setNotification({
        open: true,
        message: 'Ошибка обновления профиля',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const isDirty = user && (
    (user.firstName || '') !== values.firstName ||
    (user.lastName || '') !== values.lastName ||
    (user.phone || '') !== values.phone ||
    (user.city || '') !== values.city ||
    (user.country || '') !== values.country
  );

  return (
    <form
      autoComplete="off"
      noValidate
      {...props}
      onSubmit={handleSubmit}
    >
      <Card>
        <CardHeader
          subheader="Информация может быть изменена"
          title="Профиль"
        />
        <Divider />
        <CardContent>
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                helperText="Пожалуйста, укажите имя"
                label="Имя"
                name="firstName"
                onChange={handleChange}
                required
                value={values.firstName}
                variant="outlined"
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Фамилия"
                name="lastName"
                onChange={handleChange}
                required
                value={values.lastName}
                variant="outlined"
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Email адрес"
                name="email"
                onChange={handleChange}
                required
                value={values.email}
                variant="outlined"
                disabled
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <InputMask
                mask="+7 (999) 999-99-99"
                value={values.phone}
                onChange={handleChange}
              >
                {(inputProps) => (
                  <TextField
                    {...inputProps}
                    fullWidth
                    label="Номер телефона"
                    name="phone"
                    type="text"
                    variant="outlined"
                  />
                )}
              </InputMask>
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Страна"
                name="country"
                onChange={handleChange}
                value={values.country}
                variant="outlined"
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Город"
                name="city"
                onChange={handleChange}
                // required
                value={values.city}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            p: 2
          }}
        >
          <Button
            color="primary"
            variant="contained"
            type="submit"
            disabled={loading || !isDirty}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Сохранить детали'}
          </Button>
        </Box>
      </Card>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </form>
  );
};
