import PropTypes from 'prop-types';
import { Box, MenuItem, MenuList, Popover, Typography } from '@mui/material';
import { useAuthContext } from '../contexts/auth-context';
import NextLink from 'next/link';

export const AccountPopover = (props) => {
  const { anchorEl, onClose, open, ...other } = props;
  const { user, signOut } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      // Redirect handled by component usage or auth guard usually, 
      // but here we might want to reload or push to login
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'bottom'
      }}
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: { width: '300px' }
      }}
      {...other}
    >
      <Box
        sx={{
          py: 1.5,
          px: 2
        }}
      >
        <Typography variant="subtitle1">
          {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Пользователь'}
        </Typography>
        <Typography
          color="textSecondary"
          variant="body2"
        >
          {user?.email || ''}
        </Typography>
      </Box>
      <MenuList
        disablePadding
        sx={{
          '& > *': {
            '&:first-of-type': {
              borderTopColor: 'divider',
              borderTopStyle: 'solid',
              borderTopWidth: '1px'
            },
            padding: '12px 16px'
          }
        }}
      >
        <NextLink href="/profile" passHref>
          <MenuItem onClick={onClose} component="a">
            Профиль
          </MenuItem>
        </NextLink>
        <MenuItem onClick={handleSignOut}>
          Выйти
        </MenuItem>
      </MenuList>
    </Popover>
  );
};

AccountPopover.propTypes = {
  anchorEl: PropTypes.any,
  onClose: PropTypes.func,
  open: PropTypes.bool
};
