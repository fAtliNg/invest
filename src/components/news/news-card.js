import NextLink from 'next/link';
import PropTypes from 'prop-types';
import { Box, Card, Typography, Avatar, Chip } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { decodeHtmlEntities } from '../../utils/html-decoder';

export const NewsCard = ({ news }) => {
  return (
    <NextLink href={`/news/${news.id}`} passHref>
      <Card
        component="a"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s',
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        {/* Left Content */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip 
              label={news.category || 'News'} 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.05)', 
                color: 'text.secondary',
                fontWeight: 600,
                borderRadius: 1
              }} 
            />
            <Typography variant="caption" color="text.secondary">
              {news.date ? format(new Date(news.date), 'd MMM yyyy', { locale: ru }) : ''}
            </Typography>
          </Box>
          
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 700, 
              mb: 1.5,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {decodeHtmlEntities(news.title)}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2
            }}
          >
            {decodeHtmlEntities(news.description)}
          </Typography>
        </Box>

        {/* Action / Meta area could go here, but user asked to remove bottom block */}
      </Box>

      {/* Right Image */}
      <Box
        sx={{
          width: '40%',
          minWidth: 140,
          position: 'relative',
          display: { xs: 'none', sm: 'block' }
        }}
      >
        <Box
          component="img"
          src={news.image}
          alt={news.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
    </Card>
    </NextLink>
  );
};

NewsCard.propTypes = {
  news: PropTypes.shape({
    category: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    authorAvatar: PropTypes.string,
  }).isRequired
};
