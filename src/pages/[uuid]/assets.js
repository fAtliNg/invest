import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  Grid,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DashboardLayout } from '../../components/dashboard-layout';
import { useAuthContext } from '../../contexts/auth-context';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { PortfolioSidebar } from '../../components/portfolios/details/portfolio-sidebar';
import { PortfolioAssetsTable } from '../../components/portfolios/assets/portfolio-assets-table';
import { AddAssetDialog } from '../../components/portfolios/assets/add-asset-dialog';
import { EditAssetDialog } from '../../components/portfolios/assets/edit-asset-dialog';

const PortfolioAssets = () => {
  const router = useRouter();
  const { uuid } = router.query;
  const { isAuthenticated, isLoading } = useAuthContext();
  const [portfolio, setPortfolio] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assetsRefreshKey, setAssetsRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const handleAddAsset = () => {
    setAddOpen(true);
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

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          Бумаги | {portfolio?.title || 'Загрузка...'} | Profit Case
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
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4">
                      Бумаги
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      onClick={handleAddAsset}
                    >
                      Добавить
                    </Button>
                  </Box>
                  <PortfolioAssetsTable
                    uuid={uuid}
                    refreshKey={assetsRefreshKey}
                    onEdit={(asset) => {
                      setEditAsset(asset);
                      setEditOpen(true);
                    }}
                  />
                  <AddAssetDialog
                    open={addOpen}
                    onClose={() => setAddOpen(false)}
                    onAdded={() => setAssetsRefreshKey((v) => v + 1)}
                    uuid={uuid}
                  />
                  <EditAssetDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    onUpdated={() => setAssetsRefreshKey((v) => v + 1)}
                    uuid={uuid}
                    asset={editAsset}
                  />
                </>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

PortfolioAssets.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default PortfolioAssets;
