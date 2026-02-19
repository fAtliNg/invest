import NextLink from 'next/link';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';

export const NewsList = ({ items = [] }) => {
  return (
    <List disablePadding>
      {items.map((item, idx) => (
        <NextLink key={idx} href={`/news/${item.id}`} passHref>
          <ListItem
            component="a"
            disableGutters
            sx={{
              py: 1.25,
              px: 1,
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <ListItemAvatar sx={{ minWidth: 48 }}>
              <Avatar
                sx={{
                  bgcolor: item.source.color || 'neutral.700',
                  width: 28,
                  height: 28,
                  fontSize: 16,
                  fontWeight: 700
                }}
              >
                {item.source.abbr}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography component="span" variant="body1" color="text.primary">
                  {item.title}
                </Typography>
              }
            />
          </ListItem>
        </NextLink>
      ))}
    </List>
  );
};
