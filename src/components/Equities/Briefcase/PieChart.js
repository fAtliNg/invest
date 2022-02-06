import { Doughnut } from 'react-chartjs-2';
import { Box, useTheme } from '@mui/material';
import stc from 'string-to-color';

export const PieChart = ({ securities }) => {
  console.log(securities);
  const labels = securities.map((item) => item.name);
  const colors = securities.map((item) => stc(item.name));
  const price = securities.map((item) => item.price);
  const theme = useTheme();

  const data = {
    datasets: [
      {
        data: price,
        backgroundColor: colors,
        borderColor: '#FFFFFF',
        hoverBorderColor: '#FFFFFF'
      }
    ],
    labels,
  };

  const options = {
    plugins: {
      legend: {
        display: false
      }
    },
    animation: true,
    cutoutPercentage: 80,
    layout: { padding: 0 },
    maintainAspectRatio: false,
    responsive: true,
    tooltips: {
      backgroundColor: theme.palette.background.paper,
      bodyFontColor: theme.palette.text.secondary,
      borderColor: theme.palette.divider,
      borderWidth: 1,
      enabled: true,
      footerFontColor: theme.palette.text.secondary,
      intersect: false,
      mode: 'index',
      titleFontColor: theme.palette.text.primary
    }
  };

  return (
    <>
      <Box
        sx={{
          height: 197,
          position: 'relative'
        }}
      >
        <Doughnut
          data={data}
          options={options}
        />
      </Box>
    </>
  );
};
