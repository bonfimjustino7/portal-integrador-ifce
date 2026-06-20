import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';

const SearchInput = ({ value, onChange, placeholder }) => {
  return (
    <TextField
      variant="outlined"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        style: {
          height: '40px',
          boxSizing: 'border-box',
        },
      }}
      sx={{
        width: { xs: '100%', sm: '350px' },
        maxWidth: '100%',
        mb: 1,
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: '#4CAF50',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#4CAF50',
          },
        },
      }}
    />
  );
};

export default SearchInput;