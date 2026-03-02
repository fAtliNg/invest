import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Snackbar
} from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { useAuthContext } from '../contexts/auth-context';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import { PortfolioSidebar } from '../components/portfolios/details/portfolio-sidebar';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AvatarUploadModal } from '../components/account/avatar-upload-modal';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const PortfolioDetails = () => {
  const router = useRouter();
  const { uuid } = router.query;
  const { isAuthenticated, isLoading } = useAuthContext();
  const [portfolio, setPortfolio] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [hasImageChanged, setHasImageChanged] = useState(false);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSuccess(false);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!uuid) return;
      
      try {
        const response = await axios.get(`/api/portfolios/${uuid}`);
        setPortfolio(response.data);
        setImagePreview(response.data.image);
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setError(err.response?.data?.error || 'Произошла ошибка при загрузке портфеля');
      } finally {
        setIsFetching(false);
      }
    };

    if (isAuthenticated && uuid) {
      fetchPortfolio();
    }
  }, [isAuthenticated, uuid]);

  const formik = useFormik({
    initialValues: {
      title: portfolio?.title || '',
      description: portfolio?.description || ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      title: Yup.string()
        .max(255)
        .required('Название портфеля обязательно'),
      description: Yup.string()
        .max(1000, 'Описание слишком длинное')
        .required('Описание портфеля обязательно')
    }),
    onSubmit: async (values, helpers) => {
      try {
        setSuccess(false);
        setError(null);
        const response = await axios.put(`/api/portfolios/${uuid}`, {
          ...values,
          image: imagePreview
        });
        setPortfolio(response.data);
        setHasImageChanged(false);
        setSuccess(true);
      } catch (err) {
        console.error('Failed to update portfolio:', err);
        setError(err.response?.data?.error || 'Ошибка при обновлении портфеля');
      } finally {
        helpers.setSubmitting(false);
      }
    }
  });

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setHasImageChanged(true);
    };
    reader.readAsDataURL(file);
    setIsModalOpen(false);
  };

  const isFormDirty = formik.dirty || hasImageChanged;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/portfolios/${uuid}`);
      router.push('/portfolios');
    } catch (err) {
      console.error('Failed to delete portfolio:', err);
      setError(err.response?.data?.error || 'Ошибка при удалении портфеля');
      setDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          {portfolio ? portfolio.title : 'Загрузка...'} | Profit Case
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth={false} sx={{ px: 3 }}>
          <Grid container spacing={3}>
            <Grid item>
              <PortfolioSidebar />
            </Grid>
            <Grid item xs>
              {isFetching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : error && !portfolio ? (
                <Box sx={{ mt: 3 }}>
                  <Alert 
                    severity="error"
                    action={
                      <Button 
                        color="inherit" 
                        size="small"
                        onClick={() => router.push('/portfolios')}
                      >
                        Вернуться к списку
                      </Button>
                    }
                  >
                    {error}
                  </Alert>
                </Box>
              ) : (
                <Box>
                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                  
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <form onSubmit={formik.handleSubmit}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} display="flex" alignItems="center">
                            <Box sx={{ position: 'relative', mr: 3 }}>
                              <Avatar
                                src={imagePreview}
                                variant="rounded"
                                sx={{
                                  height: 100,
                                  width: 100,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setIsModalOpen(true)}
                              >
                                {!imagePreview && <PhotoCameraIcon />}
                              </Avatar>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setIsModalOpen(true)}
                                sx={{ mt: 1, display: 'block' }}
                              >
                                Изменить
                              </Button>
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
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
                                sx={{ mb: 2 }}
                              />
                              <Typography color="textSecondary" variant="body2">
                                Текущая стоимость: {portfolio.value.toLocaleString('ru-RU')} ₽
                              </Typography>
                            </Box>
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
                              disabled={formik.isSubmitting || !isFormDirty}
                              size="large"
                              type="submit"
                              variant="contained"
                            >
                              Сохранить изменения
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderColor: 'error.main', borderStyle: 'dashed' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" color="error" gutterBottom>
                            Удалить портфель
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Удаление портфеля и всех связанных данных. Это действие необратимо.
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          Удалить портфель
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Портфель успешно обновлен
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удалить портфель?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить портфель «{portfolio?.title}»? Это действие необратимо, все данные внутри портфеля будут удалены.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={isDeleting}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <AvatarUploadModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleImageUpload}
      />
    </>
  );
};

PortfolioDetails.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default PortfolioDetails;
