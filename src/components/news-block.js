import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Typography,
  Link,
  Skeleton
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const NewsBlock = (props) => {
  const [news, setNews] = useState([]);
  const [sources, setSources] = useState([]);
  const [currentSource, setCurrentSource] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchNews = async (source) => {
    setLoading(true);
    try {
      const params = { limit: 10 };
      if (source && source !== 'All') {
        params.source = source;
      }
      const response = await axios.get('/api/news', { params });
      setNews(response.data.data);
      if (sources.length === 0) {
        setSources(['All', ...response.data.sources]);
      }
    } catch (error) {
      console.error('Failed to fetch news', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(currentSource);
  }, [currentSource]);

  const handleTabChange = (event, newValue) => {
    setCurrentSource(newValue);
  };

  return (
    <Card {...props}>
      <CardHeader title="Новости рынка" />
      <Divider />
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentSource}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="news sources tabs"
        >
          {sources.map((source) => (
            <Tab label={source === 'All' ? 'Все' : source} value={source} key={source} />
          ))}
        </Tabs>
      </Box>
      <CardContent sx={{ p: 0 }}>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {loading ? (
            Array.from(new Array(5)).map((_, index) => (
              <Box key={index} sx={{ p: 2 }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            ))
          ) : (
            news.map((item, index) => (
              <ListItem key={index} alignItems="flex-start" divider={index !== news.length - 1}>
                <ListItemText
                  primary={
                    <Link href={item.link} target="_blank" rel="noopener noreferrer" color="text.primary" underline="hover" variant="subtitle1" fontWeight="medium">
                      {item.title}
                    </Link>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.contentSnippet ? (item.contentSnippet.length > 100 ? `${item.contentSnippet.substring(0, 100)}...` : item.contentSnippet) : ''}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip label={item.source} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {item.pubDate ? format(new Date(item.pubDate), 'dd MMM HH:mm', { locale: ru }) : ''}
                      </Typography>
                    </Box>
                  }
                  disableTypography
                />
              </ListItem>
            ))
          )}
          {!loading && news.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">Новости не найдены</Typography>
            </Box>
          )}
        </List>
      </CardContent>
    </Card>
  );
};
