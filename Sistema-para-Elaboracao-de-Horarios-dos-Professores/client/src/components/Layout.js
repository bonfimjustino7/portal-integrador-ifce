import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './SideBar.js';

function Layout({ setAuthenticated }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box sx={{ display: 'flex', width: '100%', overflowX: 'hidden' }}>
            <CssBaseline />
            <Sidebar setAuthenticated={setAuthenticated} isMobile={isMobile} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    mt: 3,
                    p: 0,
                    pl: 0,
                    width: isMobile ? '100%' : 'auto',
                    boxSizing: 'border-box',
                    overflowX: 'auto',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}

export default Layout;