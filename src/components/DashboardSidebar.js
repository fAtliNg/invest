import { useEffect } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { Box, Divider, Drawer, Typography, useMediaQuery, Chip } from '@mui/material';
import { ChartBar as ChartBarIcon } from '../icons/chart-bar';
import { Info as InfoIcon } from '../icons/info';
import { NavItem } from './NavItem';
import { ROUTES } from '../constants';
import EmailIcon from '@mui/icons-material/Email';
import MovingIcon from '@mui/icons-material/Moving';

const items = [
  {
    href: ROUTES.MAIN,
    icon: (<ChartBarIcon fontSize="small" />),
    title: 'Сложный процент'
  },
  {
    href: ROUTES.EQUITIES,
    icon: (<MovingIcon fontSize="small" />),
    title: 'Проверка стратегии'
  },
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
          <Box sx={{ px: 3 }} marginTop={3} display="flex" justifyContent="space-between" >
            <Typography
              color="inherit"
              variant="h5"
              display="flex"
              justifyContent="flex-center"
            >
              Profit Case
            </Typography>
            <Chip label="v1.0.1" variant="outlined" style={{ color: "#F3F4F6" }} />
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
              display="flex"
              color="neutral.100"
              variant="subtitle2"
              style={{ textDecoration: "underline" }}
            >
              <EmailIcon style={{ marginRight: 8 }}/>
              support@profit-case.ru
            </Typography>
          </a>
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
