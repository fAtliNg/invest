import { useEffect } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Box, Divider, Drawer, Typography, useMediaQuery } from '@mui/material';
import { ChartBar as ChartBarIcon } from '../icons/chart-bar';
import { Info as InfoIcon } from '../icons/info';
import { Moving as MovingIcon } from '../icons/moving';
import { NavItem } from './nav-item';
import { ROUTES } from '../constants';

const items = [
  {
    href: ROUTES.MAIN,
    icon: (<ChartBarIcon fontSize="small" />),
    title: 'Сложный процент'
  },
  // {
  //   href: ROUTES.EQUITIES,
  //   icon: (<MovingIcon fontSize="small" />),
  //   title: 'Котировки'
  // },
  {
    href: ROUTES.ABOUT,
    icon: (<InfoIcon fontSize="small" />),
    title: 'О проекте'
  },
];

export const DashboardSidebar = (props) => {
  const { open, onClose } = props;
  const router = useRouter();
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'), {
    defaultMatches: true,
    noSsr: false
  });

  useEffect(
    () => {
      if (!router.isReady) {
        return;
      }

      if (open) {
        onClose?.();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.asPath]
  );

  const content = (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <div>
          {/*<Box sx={{ p: 3 }}>*/}
          {/*  <NextLink*/}
          {/*    href="/"*/}
          {/*    passHref*/}
          {/*  >*/}
          {/*    <a>*/}
          {/*      <Logo*/}
          {/*        sx={{*/}
          {/*          height: 42,*/}
          {/*          width: 42*/}
          {/*        }}*/}
          {/*      />*/}
          {/*    </a>*/}
          {/*  </NextLink>*/}
          {/*</Box>*/}
          <Box sx={{ px: 3 }} marginTop={3}>
            <Typography
              color="inherit"
              variant="subtitle1"
              display="flex"
              justifyContent="flex-center"
            >
              PROFIT-CASE.RU
            </Typography>
          </Box>
        </div>
        <Divider
          sx={{
            borderColor: '#2D3748',
            my: 3
          }}
        />
        <Box sx={{ flexGrow: 1 }}>
          {items.map((item) => (
            <NavItem
              key={item.title}
              icon={item.icon}
              href={item.href}
              title={item.title}
            />
          ))}
        </Box>
        <Divider sx={{ borderColor: '#2D3748' }} />
        <Box
          sx={{
            px: 2,
            py: 3
          }}
        >

          <a href="mailto:support@profit-case.ru" style={{ textDecoration: "none" }}>
            <Typography
              color="neutral.100"
              variant="subtitle2"
            >
              support@profit-case.ru
            </Typography>
          </a>
        </Box>
        <Box
          sx={{
            px: 2,
            py: 3
          }}
        >
            <Typography
              color="neutral.100"
              variant="subtitle2"
            >
              Build: 1.0.0
            </Typography>
        </Box>
      </Box>
    </>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open
        PaperProps={{
          sx: {
            backgroundColor: 'neutral.900',
            color: '#FFFFFF',
            width: 280
          }
        }}
        variant="permanent"
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: {
          backgroundColor: 'neutral.900',
          color: '#FFFFFF',
          width: 280
        }
      }}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
      variant="temporary"
    >
      {content}
    </Drawer>
  );
};

DashboardSidebar.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool
};
