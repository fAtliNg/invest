import { useRouter } from 'next/router';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ListAltIcon from '@mui/icons-material/ListAlt';

export const PortfolioSidebar = () => {
  const router = useRouter();
  const { uuid } = router.query;

  const sections = [
    {
      title: 'Информация',
      items: [
        { label: 'Описание', icon: <DescriptionIcon />, path: `/${uuid}` },
        { label: 'Бумаги', icon: <ListAltIcon />, path: `/${uuid}/assets` },
        { label: 'Стратегия', icon: <PsychologyIcon />, path: `/${uuid}/strategy` },
        { label: 'Динамика', icon: <TrendingUpIcon />, path: `/${uuid}/dynamics` }
      ]
    },
    {
      title: 'Агенты',
      items: [
        { label: 'Помощник', icon: <AssessmentIcon />, path: `/${uuid}/assistant` }
      ]
    }
  ];

  return (
    <Box sx={{ width: 280, pr: 0 }}>
      {sections.map((section, index) => (
        <Box key={section.title} sx={{ mb: 4 }}>
          <Typography
            color="textSecondary"
            variant="overline"
            sx={{ 
              px: 2, 
              mb: 1, 
              display: 'block',
              fontWeight: 'bold',
              letterSpacing: 1.2
            }}
          >
            {section.title}
          </Typography>
          <List disablePadding>
            {section.items.map((item) => {
              const active = router.asPath === item.path;
              
              return (
                <ListItem 
                  key={item.label} 
                  disablePadding 
                  sx={{ mb: 0.5 }}
                >
                  <ListItemButton
                    onClick={() => router.push(item.path)}
                    sx={{
                      borderRadius: 1,
                      backgroundColor: active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      color: active ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': {
                          color: 'primary.main'
                        }
                      },
                      '& .MuiListItemIcon-root': {
                        color: active ? 'primary.main' : 'text.secondary',
                        minWidth: 40
                      }
                    }}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        fontWeight: active ? 'bold' : 'medium'
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
};
