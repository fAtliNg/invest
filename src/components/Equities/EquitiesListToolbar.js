import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon, Typography,
  Tab,
} from '@mui/material';
import TabList from '@mui/lab/TabList';
import { Search as SearchIcon } from '../../icons/search';

export const EquitiesListToolbar = ({ handleTabChange }) => (
  <Box>
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        m: -1
      }}
    >
      <TabList onChange={handleTabChange} aria-label="lab API tabs example">
        <Tab label="Акции России" value="1" />
        <Tab label="Акции США" value="2" />
        <Tab label="Облигации" value="3" />
        <Tab label="Еврооблигации" value="4" />
        <Tab label="Фонды" value="5" />
        <Tab label="Валюта" value="6" />
      </TabList>
      <Box sx={{ m: 1 }}>
        <TextField
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SvgIcon
                  color="action"
                  fontSize="small"
                >
                  <SearchIcon />
                </SvgIcon>
              </InputAdornment>
            )
          }}
          placeholder="Найти"
          variant="outlined"
        />
      </Box>
    </Box>
  </Box>
);
