import { Bar } from 'react-chartjs-2';
import { Box, Card, CardContent, CardHeader, Divider, Typography, useTheme, Tooltip } from '@mui/material';
import { Info as InfoIcon } from '../../icons/info';

export const CreditBarGraph = (props) => {
  const theme = useTheme();

  const datasets = [
    {
      backgroundColor: '#3F51B5',
      barPercentage: 0.7,
      borderRadius: 4,
      data: props.principalPayments,
      label: 'Основной долг',
    }
  ];

  const hasEarlyRepayment = props.earlyRepaymentPayments && props.earlyRepaymentPayments.some(v => v > 0);

  if (hasEarlyRepayment) {
    datasets.push({
      backgroundColor: '#FB8C00',
      barPercentage: 0.7,
      borderRadius: 4,
      data: props.earlyRepaymentPayments,
      label: 'Досрочное погашение',
    });
  }

  datasets.push({
    backgroundColor: '#E53935',
    barPercentage: 0.7,
    borderRadius: 4,
    data: props.interestPayments,
    label: 'Переплата',
  });

  const data = {
    datasets,
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
    <Card>
      <CardHeader 
        title="Динамика выплат" 
        style={{ padding: "20px 32px" }}
        action={
          props.savings > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body1" color="textSecondary" sx={{ mr: 1 }}>
                Экономия:
              </Typography>
              <Typography variant="h6" style={{ color: '#10B981', marginRight: 8 }}>
                {props.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
              </Typography>
              <Tooltip title="Экономия от досрочного погашения">
                <InfoIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
              </Tooltip>
            </Box>
          )
        }
      />
      <Divider />
      <CardContent>
        <Box
          sx={{
            height: 400,
            position: 'relative'
          }}
        >
          <Bar
            data={data}
            options={options}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
