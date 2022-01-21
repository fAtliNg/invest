import React  from 'react';
import { TextField, Slider, Box } from '@mui/material';

export const InputSlider = (props) => {
  const availableCharacters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const onChangeWrap = (e) => {
    const newValue = e.target.value.split('')
      .map((c) => availableCharacters.includes(c.toString()) ? c : '')
      .join('').toString().replace(/^0+/, '');
    e.target.value = newValue || 0;
    props.textFieldProps.onChange(e);
  }

  return (
    <>
      <TextField
        {...props.textFieldProps}
        onChange={onChangeWrap}
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
