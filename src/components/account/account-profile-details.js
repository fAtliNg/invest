import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField
} from '@mui/material';
import { useAuthContext } from '../../contexts/auth-context';

export const AccountProfileDetails = (props) => {
  const { user, updateProfile } = useAuthContext();
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: ''
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateProfile(values);
      alert('Профиль обновлен');
    } catch (err) {
      console.error(err);
      alert('Ошибка обновления профиля');
    }
  };

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
                disabled // Email usually shouldn't be changed easily or needs verification
              />
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Номер телефона"
                name="phone"
                onChange={handleChange}
                type="text"
                value={values.phone}
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
                label="Страна"
                name="country"
                onChange={handleChange}
                required
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
                required
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
          >
            Сохранить детали
          </Button>
        </Box>
      </Card>
    </form>
  );
};
