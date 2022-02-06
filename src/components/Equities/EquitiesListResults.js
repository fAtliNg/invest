import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

export const EquitiesListResults = ({
  equities,
  addedSecurities,
  onAddSecurity,
  onRemoveSecurity,
}) => {
  const isAdded = (item) => {
    console.log(111, addedSecurities);
    console.log(222, item);
    // console.log(333, addedSecurities.some((i) => {item.id === i.id}));
    return addedSecurities.some((i) => item.id === i.id);
  }

  return (
    <Card>
      <PerfectScrollbar>
        <Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  Название
                </TableCell>
                <TableCell>
                  Цена
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {equities.map((equity) => (
                <TableRow
                  hover
                  key={equity.id}
                >
                  <TableCell>
                    <Box>
                      <Typography
                        color="rgb(63, 81, 181)"
                        variant="body1"
                        style={{ fontWeight: "bold" }}
                      >
                        {equity.name}
                      </Typography>
                      <Typography variant="body1" color={ equity.diffPercent >= 0 ? "rgb(16, 185, 129)" : "rgb(229, 57, 53)" }>
                        {`${equity.diffPercent}%`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" style={{ fontWeight: "bold" }}>
                        {`${equity.price} ₽`}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" color={ equity.diff >= 0 ? "rgb(16, 185, 129)" : "rgb(229, 57, 53)" }>
                        {`${equity.diff} ₽`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" width={150}>
                    {isAdded(equity) && <Button
                      fullWidth
                      key={equity.id}
                      color="inherit"
                      variant="contained"
                      onClick={() => onRemoveSecurity(equity)}
                    >
                      Удалить
                    </Button>}
                    {!isAdded(equity) && <Button
                      fullWidth
                      key={equity.id}
                      variant="contained"
                      onClick={() => onAddSecurity(equity)}
                    >
                      Добавить
                    </Button>}
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
