import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  useTheme,
  Tab,
} from '@mui/material';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import { useState } from 'react';
import { PieChart } from './PieChart';
import { BarGraph } from './BarGraph';

export const CalcResult = ({
  pieChartResult,
  barGraphValues,
}) => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState('1');

  const renderResultTitle = (totalBalance) => {
    return <Box display="flex" alignItems="center">
      <Typography
        color="textPrimary"
        variant="h6"
      >
        Итого:
      </Typography>
      <Typography
        style={{ color: '#10B981', marginLeft: 16, lineHeight: 0.78, wordBreak: "break-word" }}
        variant="h5"
      >
        {`${(totalBalance || 0).toLocaleString()} ₽`}
      </Typography>
    </Box>
  }

  return (
    <Card>
      <CardHeader title={renderResultTitle(pieChartResult.totalBalance)} style={{ padding: "20px 32px" }} />
      <Divider />
      <CardContent>
        <TabContext value={currentTab}>
          <TabList value={currentTab} onChange={(e, newValue) => { setCurrentTab(newValue) }} aria-label="basic tabs example">
            <Tab label="Круговая диаграмма" value="1" />
            <Tab label="Динамика роста" value="2" />
          </TabList>
          <TabPanel value="1">
            <PieChart {...pieChartResult} />
          </TabPanel>
          <TabPanel value="2">
            <BarGraph {...barGraphValues} />
          </TabPanel>
        </TabContext>
      </CardContent>
    </Card>
  );
};
