import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  SchoolOutlined
} from '@mui/icons-material';
import api from '../service/api';

const FilterByCourse = ({ value, onChange, placeholder = 'Curso', sx, disabled }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
      }
    };

    fetchCourses();
  }, []);

  const renderCourseIcon = () => {
    return <SchoolOutlined sx={{ color: '#2e7d32' }} />;
  };

  return (
    <Autocomplete
      options={courses}
      getOptionLabel={(option) => option.name || ''}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                {renderCourseIcon()}
              </InputAdornment>
            ),
            style: {
              height: '40px',
              boxSizing: 'border-box',
            },
          }}
          sx={{
            width: '100%',
            maxWidth: { sm: '500px' },
            mb: 1,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': { borderColor: '#4CAF50' },
              '&.Mui-focused fieldset': { borderColor: '#4CAF50' },
            },
            ...sx,
          }}
        />
      )}
    />
  );
};

export default FilterByCourse;