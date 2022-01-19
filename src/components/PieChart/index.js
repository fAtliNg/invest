import { Doughnut } from 'react-chartjs-2';
import { Box, Card, CardContent, CardHeader, Divider, Typography, useTheme } from '@mui/material';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import PhoneIcon from '@mui/icons-material/Phone';
import TabletIcon from '@mui/icons-material/Tablet';

export const PieChart = ({totalBalance, initialAmount, totalReplenishmentAmount, totalPercentAmount}) => {
  const theme = useTheme();

  const data = {
    datasets: [
      {
        data: [initialAmount, totalReplenishmentAmount, totalPercentAmount],
        backgroundColor: ['#3F51B5', '#D14343', '#FFB020'],
        borderWidth: 8,
        borderColor: '#FFFFFF',
        hoverBorderColor: '#FFFFFF'
      }
    ],
    labels: ['Стартовый капитал', 'Всего пополнений', 'Всего процентов']
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
      title: 'Стартовый капитал',
      value: initialAmount,
      icon: LaptopMacIcon,
      color: '#3F51B5'
    },
    {
      title: 'Всего пополнений',
      value: totalReplenishmentAmount,
      icon: TabletIcon,
      color: '#E53935'
    },
    {
      title: 'Всего процентов',
      value: totalPercentAmount,
      icon: PhoneIcon,
      color: '#FB8C00'
    }
  ];

  const renderResultTitle = (totalBalance) => {
    return <Typography
      color="textPrimary"
      variant="h6"
    >
      {`Итоговая сумма: ${totalBalance || 0}`}
    </Typography>
  }

  return (
    <Card>
      <CardHeader title={renderResultTitle(totalBalance)}/>
      <Divider />
      <CardContent>
        <Box
          sx={{
            height: 235,
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
            flexWrap: 'wrap',
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
