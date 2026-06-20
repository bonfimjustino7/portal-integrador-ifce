import React, { useState, useEffect } from 'react';
import {
    Autocomplete,
    TextField,
    InputAdornment,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    WbSunnyOutlined,
    Brightness4Outlined,
    NightsStayOutlined,
    AccessTimeOutlined,
    ScheduleOutlined
} from '@mui/icons-material';
import api from '../service/api';

const FilterByShift = ({ value, onChange, placeholder = 'Turno', sx, disabled }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [shifts, setShifts] = useState([]);

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const response = await api.get('/turns');
                setShifts(response.data);
            } catch (error) {
                console.error('Erro ao buscar turnos:', error);
            }
        };

        fetchShifts();
    }, []);

    const shiftIcons = {
        'Matutino': WbSunnyOutlined,
        'Vespertino': Brightness4Outlined,
        'Noturno': NightsStayOutlined,
        'Integral': AccessTimeOutlined
    };

    const shiftColors = {
        'Matutino': '#FFD700',
        'Vespertino': '#FFA500',
        'Noturno': '#4B0082',
        'Integral': '#2e7d32'
    };

    const defaultTimeIconColor = '#2e7d32';

    const renderShiftIcon = (shiftName) => {
        const IconComponent = shiftIcons[shiftName] || ScheduleOutlined;
        const iconColor = shiftColors[shiftName] || defaultTimeIconColor;

        return <IconComponent sx={{ color: iconColor }} />;
    };

    return (
        <Autocomplete
            options={shifts}
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
                                {renderShiftIcon(value?.name)}
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

export default FilterByShift;