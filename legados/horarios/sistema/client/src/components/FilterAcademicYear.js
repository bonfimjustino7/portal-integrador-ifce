import React, { useState, useEffect } from 'react';
import {
    Autocomplete,
    TextField,
    InputAdornment,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    EventNoteOutlined
} from '@mui/icons-material';
import api from '../service/api';

const FilterAcademicYear = ({ value, onChange, placeholder = 'Ano acadêmico', sx }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [academicYears, setAcademicYears] = useState([]);

    useEffect(() => {
        const fetchAcademicYears = async () => {
            try {
                const response = await api.get('/calendar/year');
                const data = response.data;
                const years = data.map(cal => cal.year);
                setAcademicYears(years.sort((a, b) => b - a));
            } catch (error) {
                console.error('Erro ao buscar os anos acadêmicos:', error);
            }
        };

        fetchAcademicYears();
    }, []);

    const academicYearIconColor = '#19691dff';

    return (
        <Autocomplete
            options={academicYears}
            getOptionLabel={(option) => String(option) || ''}
            value={value}
            onChange={(event, newValue) => onChange(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="outlined"
                    placeholder={placeholder}
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <InputAdornment position="start">
                                <EventNoteOutlined sx={{ color: academicYearIconColor }} />
                            </InputAdornment>
                        ),
                        style: {
                            height: '40px',
                            boxSizing: 'border-box',
                        },
                    }}
                    sx={{
                        width: '100%',
                        maxWidth: { sm: '350px' },
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

export default FilterAcademicYear;