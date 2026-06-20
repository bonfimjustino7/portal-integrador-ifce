import React, { useCallback, useMemo } from 'react';
import {
    Typography, Box, Grid, Table, TableContainer, TableCell, TableBody, TableHead, TableRow,
    Collapse, IconButton, Paper, Tooltip, Button, Menu, MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import { debounce } from 'lodash';

const ClassItem = React.memo(({
    classItem,
    daysOfWeek,
    hoursData,
    conflicts,
    expandedClasses,
    editMode,
    selectedCell,
    swapMode,
    anchorEl,
    currentClassId,
    pendingChanges,
    shiftsData,
    mapDisciplinesToGrid,
    handleCollapseToggle,
    handleToggleEdit,
    handleSaveChanges,
    handleCellClick,
    handleAddShiftClick,
    handleAddShift,
    handleCloseMenu,
    handleAddDiscipline,
    handleSwapProfessor,
    isLoading,
    isMobile,
    handleOpenObservationsDialog,
}) => {
    const { grid: classScheduleGrid, uniqueDisciplineDetails } = useMemo(() =>
        mapDisciplinesToGrid(classItem.disciplines, classItem.turnIds),
        [classItem.disciplines, classItem.turnIds, mapDisciplinesToGrid]
    );

    const disciplineLegend = useMemo(() => {
        return Object.entries(uniqueDisciplineDetails).map(([code, details]) => ({
            code,
            description: details.description,
            professorName: details.professorName,
            preferences: details.preferences,
            observation: details.observation,
            preferredDays: details.preferences && Array.isArray(details.preferences) && details.preferences.length > 0
                ? details.preferences.map(day => day.name).join(', ')
                : null,
        }));
    }, [uniqueDisciplineDetails]);

    const isExpanded = expandedClasses[classItem.id] || false;
    const isEditing = editMode[classItem.id] || false;

    const debouncedHandleCellClick = useCallback(
        debounce((discipline, classId, day, startTime, classCode) => {
            handleCellClick(discipline, classId, day, startTime, classCode);
        }, 50),
        [handleCellClick]
    );

    const optimizedHandleOpenObservationsDialog = useCallback(
        (professorName, observation) => handleOpenObservationsDialog(professorName, observation),
        [handleOpenObservationsDialog]
    );

    const getTooltipTitle = useCallback((isSelectedCell, isUnallocated, isEditing) => {
        if (!isEditing) return '';
        if (isSelectedCell) return 'Disciplina selecionada para troca. Clique em outro horário para trocar.';
        if (isUnallocated && isEditing) {
            return 'Clique para selecionar esta disciplina para troca de professor.';
        }
        return '';
    }, []);

    const renderProfessorInfo = useCallback((professorName, preferences, observation, preferredDays, onClick) => {
        if (!professorName) return null;

        const hasObservation = !!observation;

        return (
            <Box display="flex" alignItems="center">
                <Typography
                    variant="body2"
                    sx={{ fontSize: '0.85rem', mr: 0.5, whiteSpace: 'nowrap' }}
                >
                    - Prof. {professorName}
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <Tooltip
                        title={
                            <Box>
                                <Typography variant="caption" color="inherit">
                                    {preferredDays
                                        ? `Dias preferenciais: ${preferredDays}`
                                        : 'Nenhum dia preferencial definido'}
                                </Typography>
                            </Box>
                        }
                        arrow
                    >
                        <IconButton
                            size="small"
                            sx={{ verticalAlign: 'middle', color: '#2e7d32' }}
                            onClick={() => onClick(professorName, observation)}
                        >
                            <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {hasObservation && (
                        <Box
                            onClick={() => onClick(professorName, observation)}
                            sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                width: 13,
                                height: 13,
                                backgroundColor: '#d32f2f',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            1
                        </Box>
                    )}
                </Box>
            </Box>
        );
    }, []);

    return (
        <Grid key={classItem.id}>
            <Box
                sx={{
                    mb: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    p: 2,
                    bgcolor: conflicts.some(
                        (conflict) =>
                            conflict.classId1 === classItem.id || conflict.classId2 === classItem.id
                    )
                        ? '#fff3e0'
                        : '#fdfdfd',
                    boxShadow: conflicts.some(
                        (conflict) =>
                            conflict.classId1 === classItem.id || conflict.classId2 === classItem.id
                    )
                        ? '0 0 8px rgba(255, 152, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    width: isMobile ? '100%' : 'auto',
                    maxWidth: isMobile ? '280px' : 'none',
                    transition: 'box-shadow 0.2s ease',
                    willChange: 'box-shadow',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: isMobile && isEditing ? 'flex-start' : 'center',
                        flexDirection: isMobile && isEditing ? 'column' : 'row',
                        justifyContent: isMobile ? 'space-between' : 'space-between',
                        mb: 1.5,
                        width: '100%',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: isMobile && isEditing ? 1 : 0,
                            width: isMobile && isEditing ? '100%' : 'auto',
                        }}
                    >
                        <GroupIcon sx={{ mr: 0.7, color: '#2e7d32', fontSize: '1.3rem' }} />
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#1a3c34',
                                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                            }}
                        >
                            <span style={{ fontWeight: 600 }}>Turma:</span> {classItem.code}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: isMobile && isEditing ? 'column' : 'row',
                            alignItems: isMobile && isEditing ? 'stretch' : 'center',
                            gap: isMobile && isEditing ? 1 : 1,
                            width: isMobile && isEditing ? '100%' : 'auto',
                        }}
                    >
                        {isEditing && (
                            <>
                                <Button
                                    variant={swapMode?.mode === 'professor' && swapMode.classId === classItem.id ? 'contained' : 'outlined'}
                                    onClick={() => handleSwapProfessor(classItem.id)}
                                    disabled={isLoading}
                                    sx={{
                                        height: '32px',
                                        borderColor: swapMode?.mode === 'professor' && swapMode.classId === classItem.id ? '#0288d1' : '#0288d1',
                                        color: swapMode?.mode === 'professor' && swapMode.classId === classItem.id ? '#fff' : '#0288d1',
                                        backgroundColor: swapMode?.mode === 'professor' && swapMode.classId === classItem.id ? '#0288d1' : '#fff',
                                        '&:hover': {
                                            backgroundColor: swapMode?.mode === 'professor' && swapMode.classId === classItem.id ? '#0277bd' : '#f5f5f5',
                                            borderColor: swapMode?.mode === 'professor' && swapMode.classId === classItem.id ? '#0277bd' : '#01579b',
                                        },
                                        textTransform: 'none',
                                        fontSize: '0.9rem',
                                        padding: '4px 8px',
                                        minWidth: isMobile ? '100%' : '120px',
                                    }}
                                >
                                    Trocar Professor
                                </Button>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl) && currentClassId === classItem.id}
                                    onClose={handleCloseMenu}
                                >
                                    {shiftsData
                                        .filter((shift) => !classItem.turnIds.includes(shift.id))
                                        .map((shift) => (
                                            <MenuItem
                                                key={shift.id}
                                                onClick={() => handleAddShift(shift.id)}
                                            >
                                                {shift.name}
                                            </MenuItem>
                                        ))}
                                </Menu>
                            </>
                        )}
                        <Tooltip title={isEditing ? 'Salvar alterações' : 'Editar horários'}>
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleToggleEdit(classItem.id)}
                                        disabled={isLoading}
                                        sx={{
                                            height: '32px',
                                            borderColor: '#d32f2f',
                                            color: '#d32f2f',
                                            backgroundColor: '#fff',
                                            '&:hover': {
                                                backgroundColor: '#fff',
                                                borderColor: '#b71c1c',
                                            },
                                            textTransform: 'none',
                                            fontSize: '0.9rem',
                                            padding: '4px 8px',
                                            minWidth: isMobile ? '100%' : '80px',
                                        }}
                                    >
                                        Cancelar Edição
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleSaveChanges(classItem.id)}
                                        disabled={
                                            isLoading ||
                                            !pendingChanges.some((change) => change.classId === classItem.id)
                                        }
                                        sx={{
                                            height: '32px',
                                            backgroundColor: '#2e7d32',
                                            '&:hover': { backgroundColor: '#1b5e20' },
                                            textTransform: 'none',
                                            fontSize: '0.9rem',
                                            padding: '4px 8px',
                                            minWidth: isMobile ? '100%' : '80px',
                                        }}
                                    >
                                        Salvar Edição
                                    </Button>
                                </>
                            ) : (
                                <IconButton
                                    onClick={() => handleToggleEdit(classItem.id)}
                                    disabled={isLoading}
                                    sx={{ color: '#2e7d32' }}
                                >
                                    <EditIcon />
                                </IconButton>
                            )}
                        </Tooltip>
                        <IconButton
                            onClick={() => handleCollapseToggle(classItem.id)}
                            sx={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                                color: '#2e7d32',
                                willChange: 'transform',
                            }}
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </Box>
                </Box>
                <Collapse in={isExpanded} timeout={200} unmountOnExit>
                    <Box sx={{ paddingTop: '20px', borderTop: '1px solid #a5d6a7' }}>
                        <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                            <TableContainer
                                component={Paper}
                                sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}
                            >
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    color: '#fff',
                                                    backgroundColor: '#245c28ff',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Horário
                                            </TableCell>
                                            {daysOfWeek.map((day) => (
                                                <TableCell
                                                    key={day.name}
                                                    align="center"
                                                    sx={{
                                                        color: '#fff',
                                                        backgroundColor: '#245c28ff',
                                                        padding: '10px 10px',
                                                        flex: 1,
                                                        minWidth: '120px',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {day.name}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {classItem.turnIds
                                            .flatMap((turnId) => hoursData[turnId] || [])
                                            .sort((a, b) => a.hourStart.localeCompare(b.hourStart))
                                            .map((slot, index) => (
                                                <TableRow key={index}>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#424242',
                                                            textAlign: 'center',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {`${slot.hourStart.substring(0, 5)} - ${slot.hourEnd.substring(0, 5)}`}
                                                    </TableCell>
                                                    {daysOfWeek.map((day) => {
                                                        const isConflictingSlot = conflicts.some(
                                                            (conflict) =>
                                                                (conflict.classId1 === classItem.id ||
                                                                    conflict.classId2 === classItem.id) &&
                                                                conflict.day === day.name &&
                                                                classScheduleGrid[day.name][slot.hourStart].some(
                                                                    (d) =>
                                                                        d.id === conflict.disciplineId1 ||
                                                                        d.id === conflict.disciplineId2
                                                                )
                                                        );
                                                        const isSelectedCell =
                                                            selectedCell &&
                                                            selectedCell.classId === classItem.id &&
                                                            classScheduleGrid[day.name][slot.hourStart][0].id ===
                                                            selectedCell.disciplineId &&
                                                            classScheduleGrid[day.name][slot.hourStart][0].startTime ===
                                                            selectedCell.startTime &&
                                                            day.name === selectedCell.day;
                                                        const isHighlightSlot =
                                                            swapMode?.mode === 'professor' &&
                                                            classItem.id === swapMode.classId &&
                                                            classScheduleGrid[day.name][slot.hourStart][0].id !== 'unallocated';
                                                        const isUnallocated = classScheduleGrid[day.name][slot.hourStart][0].id === 'unallocated';
                                                        return (
                                                            <TableCell
                                                                key={day.name}
                                                                align="center"
                                                                sx={{
                                                                    bgcolor: isHighlightSlot
                                                                        ? '#bbdefb'
                                                                        : isSelectedCell
                                                                            ? '#c8e6c9'
                                                                            : classScheduleGrid[day.name]?.[slot.hourStart]?.some((d) => d.hasConflict)
                                                                                ? conflicts.some(
                                                                                    (c) =>
                                                                                        c.type === 'consecutive_day' &&
                                                                                        c.day === day.name &&
                                                                                        c.startTime === slot.hourStart
                                                                                )
                                                                                    ? '#ff6666'
                                                                                    : '#ffe0b2'
                                                                                : '#ffffff',
                                                                    cursor:
                                                                        isEditing && (swapMode || (isUnallocated && classScheduleGrid[day.name][slot.hourStart][0].isNewShift))
                                                                            ? 'pointer'
                                                                            : 'default',
                                                                    position: 'relative',
                                                                    whiteSpace: 'nowrap',
                                                                    '&:hover': {
                                                                        border:
                                                                            isEditing && (!isUnallocated || classScheduleGrid[day.name][slot.hourStart][0].isNewShift)
                                                                                ? '1px solid #2e7d32'
                                                                                : '1px solid #e0e0e0',
                                                                    },
                                                                    opacity: isSelectedCell ? 0.7 : 1,
                                                                    border: isConflictingSlot
                                                                        ? conflicts.some(
                                                                            (c) =>
                                                                                c.type === 'consecutive_day' &&
                                                                                c.day === day.name &&
                                                                                c.startTime === slot.hourStart
                                                                        )
                                                                            ? '2px solid #cc0000'
                                                                            : '2px solid #ff5722'
                                                                        : isSelectedCell
                                                                            ? '2px solid #2e7d32'
                                                                            : isHighlightSlot
                                                                                ? '2px solid #0288d1'
                                                                                : '1px solid #e0e0e0',
                                                                    transition: 'border 0.2s ease, background-color 0.2s ease',
                                                                    willChange: 'border, background-color',
                                                                }}
                                                                onClick={() =>
                                                                    debouncedHandleCellClick(
                                                                        classScheduleGrid[day.name][slot.hourStart][0],
                                                                        classItem.id,
                                                                        day.name,
                                                                        slot.hourStart,
                                                                        classItem.code
                                                                    )
                                                                }
                                                            >
                                                                <Tooltip
                                                                    title={getTooltipTitle(
                                                                        isSelectedCell,
                                                                        isUnallocated,
                                                                        isEditing
                                                                    )}
                                                                    arrow
                                                                >
                                                                    <div>
                                                                        {classScheduleGrid[day.name][slot.hourStart].map((disc, idx) => (
                                                                            <React.Fragment key={idx}>
                                                                                {disc.id === 'unallocated' ? (
                                                                                    isEditing && disc.isNewShift ? (
                                                                                        <Box
                                                                                            sx={{
                                                                                                display: 'flex',
                                                                                                flexDirection: 'column',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                p: 0.5,
                                                                                                borderRadius: '4px',
                                                                                                backgroundColor: '#ffffff',
                                                                                            }}
                                                                                        >
                                                                                            <Tooltip title="Adicionar Disciplina">
                                                                                                <IconButton
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        color: '#2e7d32',
                                                                                                    }}
                                                                                                    onClick={() =>
                                                                                                        handleAddDiscipline(classItem.id, day.name, slot.hourStart)
                                                                                                    }
                                                                                                >
                                                                                                    <AddIcon fontSize="small" />
                                                                                                </IconButton>
                                                                                            </Tooltip>
                                                                                        </Box>
                                                                                    ) : (
                                                                                        <Typography
                                                                                            variant="body2"
                                                                                            sx={{ color: '#757575', fontStyle: 'italic' }}
                                                                                        >
                                                                                            -
                                                                                        </Typography>
                                                                                    )
                                                                                ) : (
                                                                                    <Box
                                                                                        sx={{
                                                                                            display: 'flex',
                                                                                            flexDirection: 'column',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            p: 0.5,
                                                                                            borderRadius: '4px',
                                                                                            backgroundColor: disc.hasConflict
                                                                                                ? conflicts.some(
                                                                                                    (c) =>
                                                                                                        c.type === 'consecutive_day' &&
                                                                                                        c.day === day.name &&
                                                                                                        c.startTime === slot.hourStart
                                                                                                )
                                                                                                    ? '#ff6666'
                                                                                                    : '#ffecb3'
                                                                                                : isSelectedCell && disc.id === selectedCell.disciplineId
                                                                                                    ? '#c8e6c9'
                                                                                                    : isHighlightSlot
                                                                                                        ? 'inherit'
                                                                                                        : '#ffffff',
                                                                                            border: disc.hasConflict
                                                                                                ? conflicts.some(
                                                                                                    (c) =>
                                                                                                        c.type === 'consecutive_day' &&
                                                                                                        c.day === day.name &&
                                                                                                        c.startTime === slot.hourStart
                                                                                                )
                                                                                                    ? '1px solid #cc0000'
                                                                                                    : '1px solid #ff9800'
                                                                                                : 'none',
                                                                                            mb: 0.5,
                                                                                            position: 'relative',
                                                                                            '&:hover .swap-icon': {
                                                                                                opacity: isEditing && disc.id !== 'unallocated' ? 1 : 0,
                                                                                            },
                                                                                        }}
                                                                                    >
                                                                                        <Tooltip
                                                                                            title={`${disc.description} - Prof. ${disc.professorName}`}
                                                                                        >
                                                                                            <Typography
                                                                                                variant="caption"
                                                                                                sx={{
                                                                                                    fontWeight:
                                                                                                        isSelectedCell &&
                                                                                                            selectedCell.classId === classItem.id &&
                                                                                                            disc.id === selectedCell.disciplineId &&
                                                                                                            disc.day === selectedCell.day &&
                                                                                                            disc.startTime === selectedCell.startTime
                                                                                                            ? 'bold'
                                                                                                            : 'bold',
                                                                                                    color:
                                                                                                        isSelectedCell &&
                                                                                                            selectedCell.classId === classItem.id &&
                                                                                                            disc.id === selectedCell.disciplineId &&
                                                                                                            disc.day === selectedCell.day &&
                                                                                                            disc.startTime === selectedCell.startTime
                                                                                                            ? '#1b5e20'
                                                                                                            : '#1b5e20',
                                                                                                }}
                                                                                            >
                                                                                                {disc.code}
                                                                                            </Typography>
                                                                                        </Tooltip>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                color:
                                                                                                    isSelectedCell &&
                                                                                                        selectedCell.classId === classItem.id &&
                                                                                                        disc.id === selectedCell.disciplineId &&
                                                                                                        disc.day === selectedCell.day &&
                                                                                                        disc.startTime === selectedCell.startTime
                                                                                                        ? '#1b5e20'
                                                                                                        : '#424242',
                                                                                                fontWeight:
                                                                                                    isSelectedCell &&
                                                                                                        selectedCell.classId === classItem.id &&
                                                                                                        disc.id === selectedCell.disciplineId &&
                                                                                                        disc.day === selectedCell.day &&
                                                                                                        disc.startTime === selectedCell.startTime
                                                                                                        ? 'bold'
                                                                                                        : 'normal',
                                                                                            }}
                                                                                        >
                                                                                            {disc.professorShort}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                )}
                                                                            </React.Fragment>
                                                                        ))}
                                                                    </div>
                                                                </Tooltip>
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                        {disciplineLegend.length > 0 && (
                            <Box
                                sx={{
                                    mt: 3,
                                    bgcolor: '#f5f5f5',
                                    borderRadius: '8px',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                }}
                            >
                                <Box sx={{ p: 2, overflowX: 'auto', maxWidth: '100%' }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}
                                    >
                                        Legenda:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {disciplineLegend.map((item, index) => (
                                            <Box
                                                key={index}
                                                sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 'bold', color: '#555', mr: 0.5 }}
                                                >
                                                    {item.code}:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#555', mr: 1 }}>
                                                    {item.description}
                                                </Typography>
                                                {renderProfessorInfo(
                                                    item.professorName,
                                                    item.preferences,
                                                    item.observation,
                                                    item.preferredDays,
                                                    optimizedHandleOpenObservationsDialog
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </Box>
        </Grid>
    );
});

const CourseClassDisplay = React.memo(({
    scheduleData,
    selectedShift,
    selectedCourse,
    daysOfWeek,
    hoursData,
    conflicts,
    pendingChanges,
    shiftsData,
    expandedClasses,
    editMode,
    selectedCell,
    swapMode,
    anchorEl,
    currentClassId,
    mapDisciplinesToGrid,
    handleCollapseToggle,
    handleToggleEdit,
    handleSaveChanges,
    handleCellClick,
    handleAddShiftClick,
    handleAddShift,
    handleCloseMenu,
    handleAddDiscipline,
    handleSwapProfessor,
    isLoading,
    isMobile,
    handleOpenObservationsDialog,
}) => {
    const filteredData = useMemo(() => {
        return scheduleData.filter(
            (course) => !selectedCourse || course.id === selectedCourse.id
        );
    }, [scheduleData, selectedCourse]);

    const filteredClassesByCourse = useMemo(() => {
        return filteredData.reduce((acc, course) => {
            const filteredClasses = selectedShift
                ? course.classes.filter((classItem) => classItem.turnIds.includes(selectedShift.id))
                : course.classes;
            return { ...acc, [course.id]: filteredClasses };
        }, {});
    }, [filteredData, selectedShift]);

    return (
        <Box>
            {scheduleData.length === 0 ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '200px',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h6" color="text.secondary">
                        Nenhum horário encontrado para este calendário.
                    </Typography>
                </Box>
            ) : (
                (() => {
                    const hasClasses = filteredData.some((course) =>
                        filteredClassesByCourse[course.id].length > 0
                    );

                    if (!hasClasses) {
                        return (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '200px',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="h6" color="text.secondary">
                                    {selectedShift && selectedCourse
                                        ? 'Nenhum horário encontrado para os filtros selecionados.'
                                        : selectedShift
                                            ? 'Nenhum horário encontrado para o turno selecionado.'
                                            : 'Nenhum horário encontrado para o curso selecionado.'}
                                </Typography>
                            </Box>
                        );
                    }

                    return (
                        <Box>
                            {filteredData.map((course) => {
                                const filteredClasses = filteredClassesByCourse[course.id];

                                if (filteredClasses.length === 0) {
                                    return null;
                                }

                                return (
                                    <React.Fragment key={course.id}>
                                        <Box
                                            sx={{
                                                mb: 4,
                                                p: 2,
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)',
                                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: '#1a3c34',
                                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>Curso:</span> {course.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
                                            <Grid container spacing={3} direction="column">
                                                {filteredClasses.map((classItem) => (
                                                    <ClassItem
                                                        key={classItem.id}
                                                        classItem={classItem}
                                                        daysOfWeek={daysOfWeek}
                                                        hoursData={hoursData}
                                                        conflicts={conflicts}
                                                        expandedClasses={expandedClasses}
                                                        editMode={editMode}
                                                        selectedCell={selectedCell}
                                                        swapMode={swapMode}
                                                        anchorEl={anchorEl}
                                                        currentClassId={currentClassId}
                                                        pendingChanges={pendingChanges}
                                                        shiftsData={shiftsData}
                                                        mapDisciplinesToGrid={mapDisciplinesToGrid}
                                                        handleCollapseToggle={handleCollapseToggle}
                                                        handleToggleEdit={handleToggleEdit}
                                                        handleSaveChanges={handleSaveChanges}
                                                        handleCellClick={handleCellClick}
                                                        handleAddShiftClick={handleAddShiftClick}
                                                        handleAddShift={handleAddShift}
                                                        handleCloseMenu={handleCloseMenu}
                                                        handleAddDiscipline={handleAddDiscipline}
                                                        handleSwapProfessor={handleSwapProfessor}
                                                        isLoading={isLoading}
                                                        isMobile={isMobile}
                                                        handleOpenObservationsDialog={handleOpenObservationsDialog}
                                                    />
                                                ))}
                                            </Grid>
                                        </Box>
                                    </React.Fragment>
                                );
                            })}
                        </Box>
                    );
                })()
            )}
        </Box>
    );
});

export default CourseClassDisplay;