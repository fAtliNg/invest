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
                  Цена
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                  Макс.
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                  Мин.
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                  Изм.
                </TableCell>
                <TableCell>
                  Изм %.
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equities.map((equity) => (
                <TableRow
                  hover
                  key={equity.id}
                >
                  <TableCell>
                    <Typography
                      color="rgb(63, 81, 181)"
                      variant="body1"
                      style={{ fontWeight: "bold" }}
                    >
                      {equity.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" >
                      {equity.price}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                    <Typography variant="body1" >
                      {equity.maxPrice}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                    <Typography variant="body1" >
                      {equity.minPrice}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                    <Typography variant="body1" color={ equity.diff >= 0 ? "rgb(16, 185, 129)" : "rgb(229, 57, 53)" }>
                      {equity.diff}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" color={ equity.diffPercent >= 0 ? "rgb(16, 185, 129)" : "rgb(229, 57, 53)" }>
                      {equity.diffPercent}
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
