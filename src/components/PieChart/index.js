import { Doughnut } from 'react-chartjs-2';
import { Box, Card, CardContent, CardHeader, Divider, Typography, useTheme } from '@mui/material';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import PhoneIcon from '@mui/icons-material/Phone';
import TabletIcon from '@mui/icons-material/Tablet';

export const PieChart = ({finalBalance, contribution, percentAmount}) => {
  const theme = useTheme();

  const data = {
    datasets: [
      {
        data: [finalBalance, percentAmount, contribution],
        backgroundColor: ['#3F51B5', '#D14343', '#FFB020'],
        borderWidth: 8,
        borderColor: '#FFFFFF',
        hoverBorderColor: '#FFFFFF'
      }
    ],
    labels: ['Итоговый баланс', 'Всего процентов', 'Всего пополнений']
  };

  const options = {
    animation: true,
    cutoutPercentage: 80,
    layout: { padding: 0 },
    legend: {
      display: false
    },
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

  const devices = [
    {
      title: 'Итоговый баланс',
      value: finalBalance,
      icon: LaptopMacIcon,
      color: '#3F51B5'
    },
    {
      title: 'Всего пополнений',
      value: contribution,
      icon: TabletIcon,
      color: '#E53935'
    },
    {
      title: 'Всего процентов',
      value: percentAmount,
      icon: PhoneIcon,
      color: '#FB8C00'
    }
  ];

  return (
    <Card>
      <CardHeader title="Результат" />
      <Divider />
      <CardContent>
        <Box
          sx={{
            height: 314,
            position: 'relative'
          }}
        >
          <Doughnut
            data={data}
            options={options}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pt: 2
          }}
        >
          {devices.map(({
            color,
            icon: Icon,
            title,
            value
          }) => (
            <Box
              key={title}
              sx={{
                p: 1,
                textAlign: 'center'
              }}
            >
              <Typography
                color="textPrimary"
                variant="body1"
              >
                {title}
              </Typography>
              <Typography
                style={{ color }}
                variant="h4"
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
