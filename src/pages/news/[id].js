import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '../../components/dashboard-layout';
import { Box, Container, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, CircularProgress } from '@mui/material';
import NextLink from 'next/link';
import { getNewsById } from '../../api/news';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { decodeHtmlEntities } from '../../utils/html-decoder';

const NewsDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchNewsDetail = async () => {
        const data = await getNewsById(id);
        setNewsItem(data);
        setLoading(false);
      };
      fetchNewsDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!newsItem) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Typography>Новость не найдена</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  const decodedTitle = decodeHtmlEntities(newsItem.title);
  const mainNewsItem = newsItem.newsItems?.[0] || {};
  const decodedDescription = decodeHtmlEntities(mainNewsItem.description || '');
  const publishDate = newsItem.createdAt || mainNewsItem.publishDate;
  const isoDate = publishDate ? new Date(publishDate).toISOString() : '';

  return (
    <DashboardLayout>
      <Head>
        <title>{decodedTitle} | Profit Case</title>
        <meta name="description" content={decodedDescription.substring(0, 160)} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://profit-case.ru/news/${newsItem.id}`} />
        <meta property="og:title" content={decodedTitle} />
        <meta property="og:description" content={decodedDescription} />
        <meta property="og:site_name" content="Profit Case" />
        <meta property="og:locale" content="ru_RU" />
        {isoDate && <meta property="article:published_time" content={isoDate} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://profit-case.ru/news/${newsItem.id}`} />
        <meta name="twitter:title" content={decodedTitle} />
        <meta name="twitter:description" content={decodedDescription.substring(0, 200)} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": decodedTitle,
              "description": decodedDescription,
              "datePublished": isoDate,
              "dateModified": isoDate,
              "author": {
                "@type": "Organization",
                "name": mainNewsItem.source || "Profit Case"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Profit Case",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://profit-case.ru/static/logo.svg"
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://profit-case.ru/news/${newsItem.id}`
              }
            })
          }}
        />
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="lg">
          <Typography sx={{ mb: 3 }} variant="h4" component="h1">
            {decodedTitle}
          </Typography>
          
          <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
            {newsItem.newsItems?.map((item, index) => (
              <ListItem 
                key={index}
                component="a"
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                alignItems="center"
                sx={{
                    py: 2,
                    px: 3,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    '&:last-child': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#10B981', width: 40, height: 40, fontSize: 18, fontWeight: 'bold' }}>
                      {(item.source || 'N').charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500, 
                          fontSize: '1.05rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>
                          {item.source}
                        </Box>
                        {decodeHtmlEntities(item.description)}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {item.publishDate ? format(new Date(item.publishDate), 'HH:mm', { locale: ru }) : ''}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
            ))}
          </List>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default NewsDetail;
