import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { AppBar, Avatar, Badge, Box, Button, Container, IconButton, Toolbar, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import BellIcon from '@mui/icons-material/Notifications';
import UserCircleIcon from '@mui/icons-material/Person';
import UsersIcon from '@mui/icons-material/Group';
import NextLink from 'next/link';
import { AccountPopover } from './account-popover';
import { useAuthContext } from '../contexts/auth-context';

const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3]
}));

export const DashboardNavbar = (props) => {
  const { onSidebarOpen, controls, ...other } = props;
  const settingsRef = useRef(null);
  const [openAccountPopover, setOpenAccountPopover] = useState(false);
  const { user, isAuthenticated } = useAuthContext();

  return (
    <>
      <DashboardNavbarRoot
        sx={{
          left: {
            lg: 280
          },
          width: {
            lg: 'calc(100% - 280px)'
          }
        }}
        {...other}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: 64,
            left: 0,
            px: 0
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <IconButton
              onClick={onSidebarOpen}
              sx={{
                display: {
                  xs: 'inline-flex',
                  lg: 'none'
                },
                mr: 1
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            {controls}
            {isAuthenticated ? (
              <Avatar
                onClick={() => setOpenAccountPopover(true)}
                ref={settingsRef}
                sx={{
                  cursor: 'pointer',
                  height: 40,
                  width: 40,
                  ml: 1
                }}
                src={user?.avatar || '/static/images/avatars/avatar_1.png'}
              >
                <UserCircleIcon fontSize="small" />
              </Avatar>
            ) : (
              <>
                <NextLink href="/login" passHref>
                  <IconButton
                    component="a"
                    sx={{
                      ml: 1,
                      display: {
                        xs: 'inline-flex',
                        sm: 'none'
                      },
                      color: 'text.secondary'
                    }}
                  >
                    <UserCircleIcon fontSize="small" />
                  </IconButton>
                </NextLink>
                <NextLink href="/login" passHref>
                  <Button
                    component="a"
                    variant="text"
                    startIcon={<UserCircleIcon fontSize="small" />}
                    sx={{
                      ml: 2,
                      display: {
                        xs: 'none',
                        sm: 'inline-flex'
                      },
                      color: 'text.secondary',
                      textTransform: 'none',
                      fontSize: 16,
                      fontWeight: 600
                    }}
                  >
                    Войти
                  </Button>
                </NextLink>
              </>
            )}
          </Container>
        </Toolbar>
      </DashboardNavbarRoot>
      <AccountPopover
        anchorEl={settingsRef.current}
        open={openAccountPopover}
        onClose={() => setOpenAccountPopover(false)}
      />
    </>
  );
};

DashboardNavbar.propTypes = {
  onSidebarOpen: PropTypes.func
};
