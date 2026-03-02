import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  Alert,
  Avatar,
  IconButton
} from '@mui/material';
import { DashboardLayout } from '../../components/dashboard-layout';
import { useAuthContext } from '../../contexts/auth-context';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AvatarUploadModal } from '../../components/account/avatar-upload-modal';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const PortfolioCreate = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
    },
    validationSchema: Yup.object({
      title: Yup.string()
        .max(255)
        .required('Название портфеля обязательно'),
      description: Yup.string()
        .max(1000, 'Описание слишком длинное')
        .required('Описание портфеля обязательно'),
    }),
    onSubmit: async (values, helpers) => {
      try {
        const response = await axios.post('/api/portfolios', {
          title: values.title,
          description: values.description,
          image: imagePreview // This is the base64 string from FileReader
        });
        const { uuid } = response.data;
        router.push(`/${uuid}`);
      } catch (err) {
        console.error('Failed to create portfolio:', err);
        setError(err.response?.data?.error || 'Ошибка при создании портфеля');
        helpers.setSubmitting(false);
      }
    }
  });

  const handleImageUpload = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setIsModalOpen(false);
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          Создание портфеля | Profit Case
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={() => router.push('/portfolios')}
            sx={{ mb: 3 }}
          >
            Назад к списку
          </Button>
          <Typography
            sx={{ mb: 3 }}
            variant="h4"
          >
            Создание нового портфеля
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Card>
            <CardContent>
              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} display="flex" flexDirection="column" alignItems="center">
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={imagePreview}
                        variant="rounded"
                        sx={{
                          height: 200,
                          width: '100%',
                          minWidth: 300,
                          mb: 2,
                          backgroundColor: 'neutral.100',
                          border: '1px solid',
                          borderColor: 'neutral.300'
                        }}
                      >
                        {!imagePreview && <PhotoCameraIcon sx={{ fontSize: 40 }} />}
                      </Avatar>
                      <Button
                        variant="outlined"
                        onClick={() => setIsModalOpen(true)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        {imagePreview ? 'Изменить фото' : 'Загрузить фото'}
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      error={Boolean(formik.touched.title && formik.errors.title)}
                      fullWidth
                      helperText={formik.touched.title && formik.errors.title}
                      label="Название портфеля"
                      name="title"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.title}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      error={Boolean(formik.touched.description && formik.errors.description)}
                      fullWidth
                      helperText={formik.touched.description && formik.errors.description}
                      label="Описание"
                      name="description"
                      multiline
                      rows={4}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.description}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      color="primary"
                      disabled={formik.isSubmitting}
                      fullWidth
                      size="large"
                      type="submit"
                      variant="contained"
                    >
                      Создать портфель
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Box>
      <AvatarUploadModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleImageUpload}
      />
    </>
  );
};

PortfolioCreate.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default PortfolioCreate;
