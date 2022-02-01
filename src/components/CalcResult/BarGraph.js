import { Bar } from 'react-chartjs-2';
import { Box, useTheme } from '@mui/material';

export const BarGraph = (props) => {
  const theme = useTheme();

  const data = {
    datasets: [
      {
        backgroundColor: '#3F51B5',
        barPercentage: 0.7,
        // barThickness: 12,
        borderRadius: 4,
        // categoryPercentage: 0.5,
        data: props.initialAmounts,
        label: 'Стартовый капитал',
        // maxBarThickness: 10,
      },
      {
        backgroundColor: '#E53935',
        barPercentage: 0.7,
        // barThickness: 12,
        borderRadius: 4,
        // categoryPercentage: 0.5,
        data: props.totalReplenishmentAmounts,
        label: 'Всего пополнений',
        // maxBarThickness: 10
      },
      {
        backgroundColor: '#FB8C00',
        barPercentage: 0.7,
        // barThickness: 12,
        borderRadius: 4,
        // categoryPercentage: 0.5,
        data: props.totalPercentAmounts,
        label: 'Всего процентов',
        // maxBarThickness: 10
      }
    ],
    labels: props.labels,
  };

  const options = {
    animation: true,
    cornerRadius: 20,
    layout: { padding: 0 },
    legend: { display: false },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true
      }
    },
    xAxes: [
      {
        ticks: {
          fontColor: theme.palette.text.secondary
        },
        gridLines: {
          display: false,
          drawBorder: false
        }
      }
    ],
    yAxes: [
      {
        ticks: {
          fontColor: theme.palette.text.secondary,
          beginAtZero: true,
          min: 0
        },
        gridLines: {
          borderDash: [2],
          borderDashOffset: [2],
          color: theme.palette.divider,
          drawBorder: false,
          zeroLineBorderDash: [2],
          zeroLineBorderDashOffset: [2],
          zeroLineColor: theme.palette.divider
        }
      }
    ],
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
    <Box
      sx={{
        height: 190,
        position: 'relative'
      }}
    >
      <Bar
        data={data}
        options={options}
      />
    </Box>
  );
};
