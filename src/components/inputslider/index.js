import React  from 'react';
import { TextField, Slider, Box } from '@mui/material';

export const InputSlider = (props) => {
  const onChangeWrap = (e) => {
    let val = e.target.value.replace(/,/g, '.');
    
    val = val.replace(/[^0-9.]/g, '');
    
    const parts = val.split('.');
    if (parts.length > 2) {
       val = parts[0] + '.' + parts.slice(1).join('');
    }
    
    val = val.replace(/^0+(?=\d)/, '');
    
    if (val === '') {
        val = '0';
    }
    
    if (val === '.') {
        val = '0.';
    }

    e.target.value = val;
    props.textFieldProps.onChange(e);
  }

  return (
    <>
      <TextField
        {...props.textFieldProps}
        onChange={onChangeWrap}
        name={props.name}
        style={{ marginBottom: -12 }}
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
