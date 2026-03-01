import { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../components/dashboard-layout';
import { Box, Container, Typography, Grid, CircularProgress } from '@mui/material';
import { NewsCard } from '../components/news/news-card';
import { fetchNews } from '../api/news';

const PAGE_SIZE = 12;

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef(null);

  const loadNews = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { items, total } = await fetchNews({ limit: PAGE_SIZE, offset });
      
      const formattedNews = items.map(item => {
        const mainItem = item.newsItems[0] || {};
        return {
          id: item.id,
          title: item.title,
          description: mainItem.description,
          date: item.createdAt,
          category: mainItem.category || 'Новости',
          source: { 
            abbr: (mainItem.source || 'N').charAt(0), 
            color: '#10B981' 
          },
          image: '/static/images/products/product_1.png' 
        };
      });

      setNews(prev => {
        // Prevent duplicates in case of strict mode double-invocation or race conditions
        const newItems = formattedNews.filter(n => !prev.some(p => p.id === n.id));
        return [...prev, ...newItems];
      });

      // Update hasMore based on total count
      if (total > 0) {
        setHasMore(offset + items.length < total);
      } else {
        // Fallback if total is not available or 0
        setHasMore(items.length === PAGE_SIZE);
      }
      
    } catch (error) {
      console.error("Failed to load news", error);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setOffset(prev => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading]);

  return (
    <DashboardLayout>
      <Head>
        <title>Новости финансовых рынков и инвестиций | Profit Case</title>
        <meta name="description" content="Читайте актуальные новости экономики, финансов и инвестиций. Аналитика рынков, котировки акций и облигаций, инструменты для инвесторов на Profit Case." />
        <meta name="keywords" content="новости финансов, инвестиции, экономика, котировки, акции, облигации, аналитика, биржа, profit case" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://profit-case.ru/" />
        <meta property="og:title" content="Новости финансовых рынков и инвестиций | Profit Case" />
        <meta property="og:description" content="Читайте актуальные новости экономики, финансов и инвестиций. Аналитика рынков, котировки акций и облигаций, инструменты для инвесторов на Profit Case." />
        <meta property="og:site_name" content="Profit Case" />
        <meta property="og:locale" content="ru_RU" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://profit-case.ru/" />
        <meta name="twitter:title" content="Новости финансовых рынков и инвестиций | Profit Case" />
        <meta name="twitter:description" content="Читайте актуальные новости экономики, финансов и инвестиций. Аналитика рынков, котировки акций и облигаций, инструменты для инвесторов на Profit Case." />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Новости финансовых рынков и инвестиций",
              "description": "Актуальные новости экономики, финансов и инвестиций. Аналитика рынков, котировки акций и облигаций.",
              "url": "https://profit-case.ru/",
              "publisher": {
                "@type": "Organization",
                "name": "Profit Case",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://profit-case.ru/static/logo.svg"
                }
              }
            })
          }}
        />
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="lg">
          <Typography sx={{ mb: 3 }} variant="h4" component="h1">
            Лента новостей
          </Typography>
          
          <Grid container spacing={3}>
            {news.map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <NewsCard news={item} />
              </Grid>
            ))}
          </Grid>
          
          {/* Loading indicator / Sentinel */}
          <Box 
            ref={observerTarget} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              py: 4,
              minHeight: '50px'
            }}
          >
            {loading && <CircularProgress />}
            {!hasMore && news.length > 0 && (
              <Typography variant="body2" color="textSecondary">
                Все новости загружены
              </Typography>
            )}
          </Box>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default News;
