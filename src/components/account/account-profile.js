import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Typography
} from '@mui/material';
import { useAuthContext } from '../../contexts/auth-context';

export const AccountProfile = (props) => {
  const { user } = useAuthContext();

  return (
    <Card {...props}>
      <CardContent>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Avatar
            src={user?.avatar || '/static/images/avatars/avatar_1.png'}
            sx={{
              height: 64,
              mb: 2,
              width: 64
            }}
          />
          <Typography
            color="textPrimary"
            gutterBottom
            variant="h5"
          >
            {user?.firstName || user?.email} {user?.lastName}
          </Typography>
          <Typography
            color="textSecondary"
            variant="body2"
          >
            {user?.city} {user?.country}
          </Typography>
        </Box>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          color="primary"
          fullWidth
          variant="text"
        >
          Загрузить фото
        </Button>
      </CardActions>
    </Card>
  );
};
