import {
  Box, Grid
} from '@mui/material';
import { PieChart } from './PieChart';

export const Briefcase = ({ securities }) => (
  <Grid
    container
    spacing={3}
  >
    <Grid
      item
      xs={12}
    >
      <PieChart securities={securities} />
    </Grid>
  </Grid>
);
