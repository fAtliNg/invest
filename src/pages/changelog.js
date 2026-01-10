import Head from 'next/head';
import { Box, Container, Typography, Card, CardContent, Chip } from '@mui/material';
import { DashboardLayout } from '../components/dashboard-layout';

const Changelog = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "История изменений Profit Case",
    "description": "Хронология обновлений сервиса: новые калькуляторы, функции и улучшения.",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "v1.0.1 - Кредитный калькулятор",
        "description": "Добавлен полноценный кредитный калькулятор с расчетом переплаты и графиками."
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "v1.0.0 - MVP",
        "description": "Официальный запуск MVP. Калькулятор сложного процента."
      }
    ]
  };

  return (
    <DashboardLayout>
      <Head>
        <title>История изменений и обновлений | Profit Case</title>
        <meta name="description" content="Полная история изменений сервиса Profit Case. Узнайте о новых функциях, улучшенных калькуляторах и инструментах для инвестора в нашем changelog." />
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

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip label="v1.0.1" color="primary" sx={{ mr: 2 }} />
              <Typography variant="subtitle1" color="textSecondary">
                10 января 2026
              </Typography>
            </Box>
            <Typography variant="body1">
              Добавлен полноценный кредитный калькулятор. Теперь вы можете рассчитать график платежей, оценить переплату и увидеть выгоду от досрочных погашений с помощью наглядных интерактивных графиков.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip label="v1.0.0" variant="outlined" sx={{ mr: 2 }} />
              <Typography variant="subtitle1" color="textSecondary">
                4 февраля 2022
              </Typography>
            </Box>
            <Typography variant="body1">
              Официальный запуск MVP. Представлен базовый функционал для инвесторов: калькулятор сложного процента, позволяющий визуализировать рост капитала с учетом реинвестирования прибыли.
            </Typography>
          </CardContent>
        </Card>

      </Container>
    </Box>
  </DashboardLayout>
  );
};

export default Changelog;
