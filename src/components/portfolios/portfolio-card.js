import PropTypes from 'prop-types';
import { Box, Card, CardContent, Divider, Typography, CardMedia } from '@mui/material';
import { useRouter } from 'next/router';

export const PortfolioCard = ({ portfolio, ...rest }) => {
  const router = useRouter();

  const handleClick = () => {
    if (portfolio.uuid) {
      router.push(`/${portfolio.uuid}`);
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)'
        }
      }}
      onClick={handleClick}
      {...rest}
    >
      <CardMedia
        component="img"
        height="200"
        image={portfolio.image}
        alt={portfolio.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          color="textPrimary"
          gutterBottom
          variant="h5"
          sx={{ 
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {portfolio.title}
        </Typography>
        <Typography
          color="textSecondary"
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            minHeight: '4.5em' // Ensures consistent height for 3 lines
          }}
        >
          {portfolio.description}
        </Typography>
      </CardContent>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          color="textSecondary"
          variant="caption"
          sx={{ fontWeight: 'medium' }}
        >
          Стоимость
        </Typography>
        <Typography
          color="primary"
          variant="h6"
          sx={{ fontWeight: 'bold' }}
        >
          {portfolio.value.toLocaleString('ru-RU')} ₽
        </Typography>
      </Box>
    </Card>
  );
};

PortfolioCard.propTypes = {
  portfolio: PropTypes.object.isRequired
};
