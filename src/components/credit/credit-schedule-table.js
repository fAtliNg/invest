import {
  Box,
  Button,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { format } from 'date-fns';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';

export const CreditScheduleTable = ({ payments = [], summary, ...props }) => {
  const handleDownload = () => {
    const monthlyPayment = payments.length > 0 ? payments[0].amount : 0;
    const totalPayment = summary?.totalPayment || 0;
    const totalPrincipal = summary?.totalPrincipal || 0;
    const totalInterest = summary?.totalInterest || 0;
    const interestPercent = totalPrincipal > 0 ? (totalInterest / totalPrincipal * 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 0;

    const formatCurrency = (val) => val.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
    
    // Helper to round numbers to 2 decimal places for raw data in Excel
    const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

    const data = [
      ['Сумма платежа в месяц', null, null, formatCurrency(monthlyPayment)],
      ['Всего платежей', null, null, formatCurrency(totalPayment)],
      ['Переплата', null, null, `${formatCurrency(totalInterest)} (${interestPercent}% от суммы кредита)`],
      ['Полная стоимость кредита', null, null, formatCurrency(totalPayment)],
      [],
      ['№', 'Дата', 'Сумма', 'Основной долг', 'Выплата процентов', 'Остаток']
    ];

    payments.forEach(p => {
      data.push([
        p.number,
        format(p.date, 'dd.MM.yyyy'),
        roundTwo(p.amount) + ' ₽',
        roundTwo(p.principal) + ' ₽',
        roundTwo(p.interest) + ' ₽',
        roundTwo(p.balance) + ' ₽'
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Merge cells for summary rows
    // Merge A-C (cols 0-2) for labels, D-F (cols 3-5) for values
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Row 0 Label
      { s: { r: 0, c: 3 }, e: { r: 0, c: 5 } }, // Row 0 Value
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // Row 1 Label
      { s: { r: 1, c: 3 }, e: { r: 1, c: 5 } }, // Row 1 Value
      { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // Row 2 Label
      { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } }, // Row 2 Value
      { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Row 3 Label
      { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } }  // Row 3 Value
    ];

    // Set column widths
    const wscols = [
      { wch: 6 },  // A: № (minimal)
      { wch: 12 }, // B: Date
      { wch: 15 }, // C: Sum
      { wch: 15 }, // D: Principal
      { wch: 15 }, // E: Interest
      { wch: 15 }  // F: Balance
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, 'График платежей');
    XLSX.writeFile(wb, 'credit_schedule.xlsx');
  };

  return (
    <Card {...props}>
      <CardHeader
        action={(
          <Button
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={handleDownload}
            size="small"
            variant="text"
          >
            Скачать
          </Button>
        )}
        title="График платежей"
      />
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  №
                </TableCell>
                <TableCell>
                  Дата
                </TableCell>
                <TableCell>
                  Сумма
                </TableCell>
                <TableCell>
                  Основной долг
                </TableCell>
                <TableCell>
                  Выплата процентов
                </TableCell>
                <TableCell>
                  Остаток
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  hover
                  key={payment.number}
                >
                  <TableCell>
                    {payment.number}
                  </TableCell>
                  <TableCell>
                    {format(payment.date, 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    {payment.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </TableCell>
                  <TableCell>
                    {payment.principal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </TableCell>
                  <TableCell>
                    {payment.interest.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </TableCell>
                  <TableCell>
                    {payment.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Card>
  );
};
