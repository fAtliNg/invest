import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

export const EquitiesListResults = ({ equities }) => {
  return (
    <Card>
      <PerfectScrollbar>
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Название
                </TableCell>
                <TableCell>
                  Дата фиксации
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                  Цена
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equities.map((equity, index) => (
                <TableRow
                  hover
                  key={index}
                >
                  <TableCell>
                    <Typography
                      color="rgb(63, 81, 181)"
                      variant="body1"
                      style={{ fontWeight: "bold" }}
                    >
                      {equity.instrumentName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" >
                      {new Date(equity.payDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                    <Typography variant="body1" >
                      {equity.payValue} ₽
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
    </Card>
  );
};

EquitiesListResults.propTypes = {
  equities: PropTypes.array.isRequired
};
