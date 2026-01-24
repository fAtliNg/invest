import Head from 'next/head';
import { Box, Container, Typography, Card, CardContent, Chip, CircularProgress } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Changelog = () => {
  const [changelog, setChangelog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await axios.get('/api/changelog');
        setChangelog(response.data);
      } catch (error) {
        console.error('Failed to fetch changelog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "История изменений Profit Case",
    "description": "Хронология обновлений сервиса: новые калькуляторы, функции и улучшения.",
    "itemListElement": changelog.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.version,
      "description": item.description
    }))
  };

  return (
    <DashboardLayout>
      <Head>
        <title>История изменений и обновлений | Profit Case</title>
        <meta
          name="description"
          content="Полная история изменений сервиса Profit Case. Узнайте о новых функциях, улучшенных калькуляторах и инструментах для инвестора в нашем changelog."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
            component="h1"
          >
            История изменений
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            changelog.map((item) => (
              <Card
                sx={{ mb: 3 }}
                key={item.version}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={item.version}
                      color={item.version === changelog[0]?.version ? 'primary' : 'default'}
                      variant={item.version === changelog[0]?.version ? 'filled' : 'outlined'}
                      sx={{ mr: 2 }}
                    />
                    <Typography
                      variant="subtitle1"
                      color="textSecondary"
                    >
                      {format(new Date(item.date), 'd MMMM yyyy', { locale: ru })}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}

        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default Changelog;
