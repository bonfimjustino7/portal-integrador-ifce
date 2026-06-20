import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import { CheckCircle, Info, Warning, Error } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export const AlertMessage = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const validTypes = ['success', 'info', 'warning', 'error'];
    const alertType = validTypes.includes(type) ? type : 'info';
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const iconSize = isMobile ? 'small' : 'big';

    useEffect(() => {
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) {
                setTimeout(onClose, 300);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [message, type, onClose]);

    const getAlertIcon = () => {
        const iconStyle = { fontSize: iconSize };
        let color;
        if (isMobile) {
            color = {
                success: '#a5d6a7',
                info: '#90caf9',
                warning: '#ffb74d',
                error: '#ef9a9a',
            }[alertType];
        } else {
            color = {
                success: '#4caf50',
                info: '#2196f3',
                warning: '#ff9800',
                error: '#f44336',
            }[alertType];
        }

        switch (alertType) {
            case 'success':
                return <CheckCircle style={{ ...iconStyle, color: color }} />;
            case 'info':
                return <Info style={{ ...iconStyle, color: color }} />;
            case 'warning':
                return <Warning style={{ ...iconStyle, color: color }} />;
            case 'error':
                return <Error style={{ ...iconStyle, color: color }} />;
            default:
                return <Info style={{ ...iconStyle, color: color }} />;
        }
    };

    const backgroundColorMobile = {
        success: '#1b5e20',
        info: '#0d47a1',
        warning: '#e65100',
        error: '#b71c1c',
    }[alertType];

    const borderColorDesktop = {
        success: '#4caf50',
        info: '#2196f3',
        warning: '#ff9800',
        error: '#f44336',
    }[alertType];

    const textColorDesktop = borderColorDesktop;

    const transitionDuration = '0.3s';

    return (
        <Alert
            variant={isMobile ? 'filled' : 'outlined'}
            severity={alertType}
            icon={getAlertIcon()}
            sx={{
                position: 'fixed',
                top: '20px',
                right: '30px',
                left: 'auto',
                bottom: 'auto',
                transform: 'translateX(0)',
                width: 'auto',
                minWidth: '200px',
                maxWidth: isMobile ? 'calc(100% - 20px)' : '300px',
                height: 'auto',
                padding: '8px 12px',
                borderRadius: '6px',
                boxShadow: isMobile ? 2 : 0,
                backgroundColor: isMobile ? backgroundColorMobile : 'transparent',
                borderColor: isMobile ? backgroundColorMobile : borderColorDesktop,
                color: isMobile ? '#fff' : textColorDesktop,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                '& .MuiAlert-icon': {
                    marginLeft: '4px',
                    marginBottom: '2px',
                },
                opacity: isVisible ? 1 : 0,
                transition: `opacity ${transitionDuration} ease-in-out`,
                zIndex: 1500,
                fontSize: '0.875rem',
                wordBreak: 'break-word',
            }}
        >
            {message}
        </Alert>
    );
};

export default AlertMessage;