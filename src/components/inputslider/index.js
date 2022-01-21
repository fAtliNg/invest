import React  from 'react';
import { TextField, Slider, Box } from '@mui/material';

export const InputSlider = (props) => {
  return (
    <>
      <TextField
        {...props.textFieldProps}
        name={props.name}
        style={{ marginBottom: -34 }}
        value={props.value}
      />
      <Box style={{ marginLeft: 8, marginRight: 8, paddingBottom: 11 }}>
        <Slider
          {...props.sliderProps}
          name={props.name}
          size="small"
          value={props.value}
          aria-label="Small"
          style={{ paddingTop: 6, paddingBottom: 6 }}
        />
      </Box>
    </>
  )
};
