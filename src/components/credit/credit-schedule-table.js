import {
  Box,
  Button,
  Card,
  CardHeader,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography
} from '@mui/material';
import { format } from 'date-fns';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';
import { useEffect, useMemo, useRef, useState } from 'react';

const VIRTUAL_ROW_HEIGHT = 49;
const VIRTUAL_OVERSCAN = 8;

export const CreditScheduleTable = ({ payments = [], summary, onDeleteEarlyRepayment, ...props }) => {
  const [virtualMetrics, setVirtualMetrics] = useState({
    scrollY: 0,
    viewportHeight: 0,
    tableTop: 0,
    headerHeight: 0
  });
  const tableRef = useRef(null);
  const tableHeadRef = useRef(null);
  const scrollRafRef = useRef(null);

  const getPaymentKey = (payment, index) => {
    if (payment?.type === 'early_repayment' && payment?.earlyRepaymentId !== undefined && payment?.earlyRepaymentId !== null) {
      return `early_${payment.earlyRepaymentId}`;
    }
    if (payment?.type === 'regular' && payment?.number !== undefined && payment?.number !== null) {
      return `regular_${payment.number}`;
    }
    const datePart = payment?.date ? format(payment.date, 'yyyy-MM-dd') : 'no_date';
    return `p_${datePart}_${payment?.amount ?? 'no_amount'}_${index}`;
  };

  const handleDownload = () => {
    const monthlyPayment = payments.length > 0 ? payments.find(p => p.type === 'regular')?.amount || 0 : 0;
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
      let row = [];
      if (p.type === 'regular') {
        row = [
          p.number,
          format(p.date, 'dd.MM.yyyy'),
          roundTwo(p.amount) + ' ₽',
          roundTwo(p.principal) + ' ₽',
          roundTwo(p.interest) + ' ₽',
          roundTwo(p.balance) + ' ₽'
        ];
      } else {
         row = [
          'Досрочно',
          format(p.date, 'dd.MM.yyyy'),
          roundTwo(p.amount) + ' ₽',
          roundTwo(p.principal) + ' ₽',
          '-',
          roundTwo(p.balance) + ' ₽'
        ];
      }
      data.push(row);
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

  const shouldVirtualize = payments.length > 200;

  useEffect(() => {
    if (!shouldVirtualize) return;

    const updateMetrics = () => {
      const tableEl = tableRef.current;
      const headEl = tableHeadRef.current;
      const tableTop = tableEl ? tableEl.getBoundingClientRect().top + window.scrollY : 0;
      const headerHeight = headEl ? headEl.getBoundingClientRect().height : VIRTUAL_ROW_HEIGHT;

      setVirtualMetrics({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        tableTop,
        headerHeight
      });
    };

    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        updateMetrics();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateMetrics();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (scrollRafRef.current) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [shouldVirtualize]);

  const { visiblePayments, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        visiblePayments: payments,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0
      };
    }

    const total = payments.length;
    const totalHeight = total * VIRTUAL_ROW_HEIGHT;
    const bodyTop = virtualMetrics.tableTop + virtualMetrics.headerHeight;
    const viewportTop = virtualMetrics.scrollY;
    const viewportBottom = virtualMetrics.scrollY + virtualMetrics.viewportHeight;
    const visibleStart = Math.max(0, viewportTop - bodyTop);
    const visibleEnd = Math.min(totalHeight, viewportBottom - bodyTop);
    const startIndex = Math.max(0, Math.floor(visibleStart / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
    const endIndex = Math.min(total, Math.ceil(visibleEnd / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN);

    return {
      visiblePayments: payments.slice(startIndex, endIndex),
      topSpacerHeight: startIndex * VIRTUAL_ROW_HEIGHT,
      bottomSpacerHeight: (total - endIndex) * VIRTUAL_ROW_HEIGHT
    };
  }, [payments, shouldVirtualize, virtualMetrics]);

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
      <Box sx={{ overflowX: 'auto', overflowAnchor: 'none' }}>
        <Box sx={{ minWidth: 800 }}>
          <TableContainer sx={{ overflowAnchor: 'none' }}>
            <Table ref={tableRef}>
            <TableHead>
              <TableRow ref={tableHeadRef}>
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
                <TableCell>
                  
                </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shouldVirtualize && topSpacerHeight > 0 && (
                  <TableRow 
                    key="spacer-top" 
                    sx={{ height: topSpacerHeight, overflowAnchor: 'none' }}
                  >
                    <TableCell 
                      colSpan={7} 
                      sx={{ p: 0, border: 0, overflowAnchor: 'none' }} 
                    />
                  </TableRow>
                )}
                {visiblePayments.map((payment, index) => (
                <TableRow
                  hover
                  key={getPaymentKey(payment, index)}
                  sx={{
                    backgroundColor: payment.type === 'early_repayment' ? 'action.hover' : 'inherit'
                  }}
                >
                  <TableCell>
                    {payment.type === 'regular' ? payment.number : (
                        <Typography 
                          variant="body2" 
                          color="textSecondary"
                        >
                            —
                        </Typography>
                    )}
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
                  <TableCell>
                    {payment.type === 'early_repayment' && (
                      <IconButton 
                        size="small" 
                        onClick={() => onDeleteEarlyRepayment(payment.earlyRepaymentId)}
                        title="Удалить досрочное погашение"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
                ))}
                {shouldVirtualize && bottomSpacerHeight > 0 && (
                  <TableRow 
                    key="spacer-bottom" 
                    sx={{ height: bottomSpacerHeight, overflowAnchor: 'none' }}
                  >
                    <TableCell 
                      colSpan={7} 
                      sx={{ p: 0, border: 0, overflowAnchor: 'none' }} 
                    />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Card>
  );
};
