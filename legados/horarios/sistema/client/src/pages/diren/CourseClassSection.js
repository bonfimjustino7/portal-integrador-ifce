import React from 'react';
import {
    Typography, Box, Divider, Button, Grid, Table, TableContainer, TableBody, TableCell, TableHead, TableRow,
    Collapse, IconButton, Paper, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { SchoolOutlined, Group } from '@mui/icons-material';

const CourseClassSection = ({
    course,
    selectedShift,
    daysOfWeek,
    hoursData,
    conflicts,
    expandedClasses,
    setExpandedClasses,
    isMobile,
    deleteMode,
    duplicateMode,
    swapMode,
    selectedCell,
    selectedSlot,
    isLoading,
    isPostCompleted,
    editMode,
    handleToggleEdit,
    handleToggleDeleteMode,
    handleToggleDuplicateMode,
    handleCellClick,
    handleSaveChanges,
    mapDisciplinesToGrid,
    hasEmptySlots,
    hasPendingChanges,
    handleOpenObservationsDialog,
}) => {
    const filteredClasses = selectedShift
        ? course.classes.filter((classItem) => classItem.turnId === selectedShift.id)
        : course.classes;

    if (filteredClasses.length === 0) {
        return null;
    }

    const getTooltipTitle = (isSelectedCell, isHighlighted, isUnallocated, classId) => {
        if (isUnallocated) return '';
        if (editMode[classId] && !isPostCompleted[classId]) return 'Clique para selecionar esta disciplina para troca.';
        if (editMode[classId] && isPostCompleted[classId]) return 'Clique para selecionar esta disciplina para troca.';
        if (isSelectedCell) return 'Disciplina selecionada para troca. Clique em outro horário para trocar.';
        if (isHighlighted) return 'Clique para excluir esta disciplina';
        if (duplicateMode[classId] && !selectedSlot && !isUnallocated) return 'Clique para selecionar esta disciplina para duplicação';
        if (duplicateMode[classId] && selectedSlot && isUnallocated) return 'Clique para duplicar a disciplina neste horário';
        if (swapMode && !isUnallocated && editMode[classId] && !isPostCompleted[classId]) return 'Clique para selecionar esta disciplina para troca';
        return '';
    };

    const renderProfessorInfo = (professorName, preferences, observation, onClick) => {
        if (!professorName) return null;
        const preferredDays = preferences && Array.isArray(preferences)
            ? preferences.map(day => day.name).join(', ')
            : 'Nenhum dia preferencial.';
        const hasObservation = typeof observation === 'object' && observation.observation
            ? observation.observation.trim() !== ''
            : typeof observation === 'string' && observation.trim() !== '';

        return (
            <Box display="flex" alignItems="center">
                <Typography variant="body2" sx={{ fontSize: '0.85rem', mr: 0.5, whiteSpace: 'nowrap' }}>
                    - Prof. {professorName}
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <Tooltip
                        title={
                            <Box>
                                <Typography variant="caption" color="inherit">
                                    Dias Preferenciais: {preferredDays}
                                </Typography>
                            </Box>
                        }
                        arrow
                    >
                        <IconButton size="small" sx={{ verticalAlign: 'middle', color: '#2e7d32' }} onClick={onClick}>
                            <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {hasObservation && (
                        <Box
                            onClick={onClick}
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
    };

    return (
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
                <SchoolOutlined sx={{ mr: 0.5, color: '#2e7d32', fontSize: '1.4rem' }} />
                <Typography
                    variant="h6"
                    sx={{
                        color: '#1a3c34',
                        fontSize: {
                            xs: '0.9rem',
                            sm: '1rem',
                        },
                    }}
                >
                    <span style={{ fontWeight: 600 }}>Curso:</span> {course.name}
                </Typography>
            </Box>
            <Divider sx={{ background: 'linear-gradient(to right, #2e7d32, #4caf50)', height: '2px', mb: 2 }} />
            <Grid container spacing={3} direction="column">
                {filteredClasses.map((classItem) => {
                    const { grid: classScheduleGrid, uniqueDisciplineDetails } = mapDisciplinesToGrid(classItem.disciplines, classItem.turnId);
                    const disciplineLegend = Object.entries(uniqueDisciplineDetails).map(([code, details]) => ({
                        code,
                        description: details.description,
                        professorName: details.professorName,
                        preferences: details.preferences,
                        observation: details.observation,
                    }));
                    const isExpanded = expandedClasses[classItem.id] || false;

                    return (
                        <Grid key={classItem.id}>
                            <Box
                                sx={{
                                    mb: 1,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    p: 2,
                                    bgcolor: conflicts.some(
                                        (conflict) => conflict.classId1 === classItem.id || conflict.classId2 === classItem.id
                                    )
                                        ? '#fff3e0'
                                        : '#fdfdfd',
                                    boxShadow: conflicts.some(
                                        (conflict) => conflict.classId1 === classItem.id || conflict.classId2 === classItem.id
                                    )
                                        ? '0 0 8px rgba(255, 152, 0, 0.3)'
                                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                    width: isMobile ? '100%' : 'auto',
                                    maxWidth: isMobile ? '280px' : 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: isMobile && editMode[classItem.id] ? 'flex-start' : 'center',
                                        flexDirection: isMobile && !isPostCompleted[classItem.id] ? 'column' : (isMobile && editMode[classItem.id] && isPostCompleted[classItem.id] ? 'column' : 'row'),
                                        justifyContent: isMobile ? 'space-between' : 'space-between',
                                        mb: 1.5,
                                        width: '100%',
                                    }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: isMobile && editMode[classItem.id] ? 1 : 0,
                                        width: isMobile && editMode[classItem.id] ? '100%' : 'auto',
                                    }}>
                                        <Group sx={{ mr: 0.7, color: '#2e7d32', fontSize: '1.3rem' }} />
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#1a3c34',
                                                fontSize: {
                                                    xs: '0.9rem',
                                                    sm: '0.95rem',
                                                },
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>Turma:</span> {classItem.code}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: isMobile && editMode[classItem.id] ? 'column' : 'row',
                                            alignItems: isMobile && editMode[classItem.id] ? 'stretch' : 'center',
                                            gap: isMobile && editMode[classItem.id] ? 1 : 1,
                                            width: isMobile && editMode[classItem.id] ? '100%' : 'auto',
                                        }}
                                    >
                                        {isPostCompleted[classItem.id] && !editMode[classItem.id] ? (
                                            <Tooltip title="Editar horários">
                                                <IconButton
                                                    onClick={() => handleToggleEdit(classItem.id)}
                                                    disabled={isLoading}
                                                    sx={{ color: '#2e7d32', padding: '4px' }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <>
                                                <Button
                                                    variant={deleteMode[classItem.id] ? 'contained' : 'outlined'}
                                                    onClick={() => handleToggleDeleteMode(classItem.id)}
                                                    disabled={isLoading}
                                                    sx={{
                                                        height: '32px',
                                                        borderColor: deleteMode[classItem.id] ? '#d32f2f' : '#d32f2f',
                                                        backgroundColor: deleteMode[classItem.id] ? '#d32f2f' : 'transparent',
                                                        color: deleteMode[classItem.id] ? '#fff' : '#d32f2f',
                                                        '&:hover': {
                                                            backgroundColor: deleteMode[classItem.id] ? '#b71c1c' : '#f5f5f5',
                                                            borderColor: deleteMode[classItem.id] ? '#b71c1c' : '#d32f2f',
                                                        },
                                                        textTransform: 'none',
                                                        fontSize: '0.9rem',
                                                        padding: '4px 8px',
                                                        minWidth: isMobile ? '100%' : '80px',
                                                    }}
                                                >
                                                    {deleteMode[classItem.id] ? 'Cancelar Remoção' : 'Remover Disciplina'}
                                                </Button>
                                                {hasEmptySlots(classItem) && (
                                                    <Button
                                                        variant={duplicateMode[classItem.id] ? 'contained' : 'outlined'}
                                                        onClick={() => handleToggleDuplicateMode(classItem.id)}
                                                        disabled={isLoading}
                                                        sx={{
                                                            height: '32px',
                                                            borderColor: duplicateMode[classItem.id] ? '#0288d1' : '#0288d1',
                                                            backgroundColor: duplicateMode[classItem.id] ? '#0288d1' : 'transparent',
                                                            color: duplicateMode[classItem.id] ? '#fff' : '#0288d1',
                                                            '&:hover': {
                                                                backgroundColor: duplicateMode[classItem.id] ? '#01579b' : '#f5f5f5',
                                                                borderColor: duplicateMode[classItem.id] ? '#01579b' : '#0288d1',
                                                            },
                                                            textTransform: 'none',
                                                            fontSize: '0.9rem',
                                                            padding: '4px 8px',
                                                            minWidth: isMobile ? '100%' : '80px',
                                                        }}
                                                    >
                                                        {duplicateMode[classItem.id] ? 'Cancelar Duplicação' : 'Duplicar Disciplina'}
                                                    </Button>
                                                )}
                                                {isPostCompleted[classItem.id] && editMode[classItem.id] && (
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
                                                )}
                                                <Button
                                                    variant="contained"
                                                    onClick={() => handleSaveChanges(classItem.id)}
                                                    disabled={isLoading || !hasPendingChanges(classItem.id)}
                                                    sx={{
                                                        height: '32px',
                                                        backgroundColor: hasPendingChanges(classItem.id) ? '#2e7d32' : '#e0e0e0',
                                                        '&:hover': {
                                                            backgroundColor: hasPendingChanges(classItem.id) ? '#1b5e20' : '#e0e0e0',
                                                        },
                                                        textTransform: 'none',
                                                        fontSize: '0.9rem',
                                                        padding: '4px 8px',
                                                        minWidth: isMobile ? '100%' : '80px',
                                                    }}
                                                >
                                                    {isPostCompleted[classItem.id] ? 'Atualizar Horário' : 'Salvar Horário'}
                                                </Button>

                                            </>
                                        )}
                                        <IconButton
                                            onClick={() => setExpandedClasses((prev) => ({
                                                ...prev,
                                                [classItem.id]: !prev[classItem.id],
                                            }))}
                                            sx={{
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s ease-in-out',
                                                color: '#2e7d32',
                                            }}
                                        >
                                            <ExpandMoreIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ paddingTop: '20px', borderTop: '1px solid #a5d6a7' }}>
                                        <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                            <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
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
                                                        {(hoursData[classItem.turnId] || []).map((slot, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell sx={{ fontWeight: 600, color: '#424242', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                                    {`${slot.hourStart.substring(0, 5)} - ${slot.hourEnd.substring(0, 5)}`}
                                                                </TableCell>
                                                                {daysOfWeek.map((day) => {
                                                                    const isConflictingSlot = conflicts.some(
                                                                        (conflict) =>
                                                                            (conflict.classId1 === classItem.id || conflict.classId2 === classItem.id) &&
                                                                            conflict.day === day.name &&
                                                                            classScheduleGrid[day.name][slot.hourStart].some(
                                                                                (d) => d.id === conflict.disciplineId1 || d.id === conflict.disciplineId2
                                                                            )
                                                                    );
                                                                    const isSelectedCell =
                                                                        selectedCell &&
                                                                        selectedCell.classId === classItem.id &&
                                                                        classScheduleGrid[day.name][slot.hourStart][0].id === selectedCell.disciplineId &&
                                                                        classScheduleGrid[day.name][slot.hourStart][0].startTime === selectedCell.startTime &&
                                                                        day.name === selectedCell.day;
                                                                    const isHighlighted = deleteMode[classItem.id] && classScheduleGrid[day.name][slot.hourStart][0].id !== 'unallocated';
                                                                    const isUnallocated = classScheduleGrid[day.name][slot.hourStart][0].id === 'unallocated';
                                                                    return (
                                                                        <Tooltip
                                                                            title={getTooltipTitle(isSelectedCell, isHighlighted, isUnallocated, classItem.id)}
                                                                            arrow
                                                                        >
                                                                            <TableCell
                                                                                key={day.name}
                                                                                align="center"
                                                                                sx={{
                                                                                    bgcolor: isSelectedCell
                                                                                        ? '#c8e6c9'
                                                                                        : classScheduleGrid[day.name]?.[slot.hourStart]?.some((d) => d.hasConflict)
                                                                                            ? '#ffe0b2'
                                                                                            : isHighlighted
                                                                                                ? '#ffcccb'
                                                                                                : duplicateMode[classItem.id] && !selectedSlot && !isUnallocated
                                                                                                    ? '#b3e5fc'
                                                                                                    : duplicateMode[classItem.id] && selectedSlot && isUnallocated
                                                                                                        ? '#b3e5fc'
                                                                                                        : '#ffffff',
                                                                                    cursor:
                                                                                        isHighlighted ||
                                                                                            (duplicateMode[classItem.id] && !selectedSlot && !isUnallocated) ||
                                                                                            (duplicateMode[classItem.id] && selectedSlot && isUnallocated) ||
                                                                                            (selectedCell &&
                                                                                                (selectedCell.classId !== classItem.id ||
                                                                                                    classScheduleGrid[day.name][slot.hourStart][0].id !== selectedCell.disciplineId ||
                                                                                                    classScheduleGrid[day.name][slot.hourStart][0].startTime !== selectedCell.startTime ||
                                                                                                    day.name !== selectedCell.day)) ||
                                                                                            (!isSelectedCell && !isUnallocated && swapMode[classItem.id])
                                                                                            ? 'pointer'
                                                                                            : 'default',
                                                                                    position: 'relative',
                                                                                    whiteSpace: 'nowrap',
                                                                                    '&:hover': {
                                                                                        border:
                                                                                            !isUnallocated ||
                                                                                                (selectedCell &&
                                                                                                    (selectedCell.classId !== classItem.id ||
                                                                                                        classScheduleGrid[day.name][slot.hourStart][0].startTime !== selectedCell.startTime ||
                                                                                                        day.name !== selectedCell.day)) ||
                                                                                                (duplicateMode[classItem.id] && selectedSlot && isUnallocated)
                                                                                                ? '1px solid #2e7d32'
                                                                                                : '1px solid #e0e0e0',
                                                                                    },
                                                                                    opacity: isSelectedCell ? 0.7 : 1,
                                                                                    border: isConflictingSlot
                                                                                        ? '2px solid #ff5722'
                                                                                        : isSelectedCell
                                                                                            ? '2px solid #2e7d32'
                                                                                            : isHighlighted
                                                                                                ? '2px solid #d32f2f'
                                                                                                : duplicateMode[classItem.id] && !selectedSlot && !isUnallocated
                                                                                                    ? '2px solid #0288d1'
                                                                                                    : duplicateMode[classItem.id] && selectedSlot && isUnallocated
                                                                                                        ? '2px solid #0288d1'
                                                                                                        : '1px solid #e0e0e0',
                                                                                    transition: 'border 0.3s ease, opacity 0.3s ease, background-color 0.3s ease',
                                                                                }}
                                                                                onClick={() => {
                                                                                    if (selectedCell && swapMode[classItem.id]) {
                                                                                        const targetDiscipline = classScheduleGrid[day.name][slot.hourStart][0];
                                                                                        if (targetDiscipline.id !== 'unallocated' && targetDiscipline.id === selectedCell.disciplineId) {
                                                                                            return;
                                                                                        }
                                                                                    }
                                                                                    handleCellClick(classScheduleGrid[day.name][slot.hourStart][0], classItem.id, day.name, slot.hourStart);
                                                                                }}
                                                                            >
                                                                                {classScheduleGrid[day.name][slot.hourStart].map((disc, idx) =>
                                                                                    disc.id === 'unallocated' ? (
                                                                                        <Typography key={idx} variant="bold" sx={{ color: '#757575', fontStyle: 'italic' }}>
                                                                                            -
                                                                                        </Typography>
                                                                                    ) : (
                                                                                        <Box
                                                                                            key={idx}
                                                                                            sx={{
                                                                                                display: 'flex',
                                                                                                flexDirection: 'column',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                p: 0.5,
                                                                                                borderRadius: '4px',
                                                                                                backgroundColor: isSelectedCell
                                                                                                    ? '#c8e6c9'
                                                                                                    : disc.hasConflict
                                                                                                        ? '#ffecb3'
                                                                                                        : isHighlighted
                                                                                                            ? '#ffcccb'
                                                                                                            : duplicateMode[classItem.id] && !selectedSlot
                                                                                                                ? '#b3e5fc'
                                                                                                                : '#ffffff',
                                                                                                border: disc.hasConflict
                                                                                                    ? '1px solid #ff9800'
                                                                                                    : isHighlighted
                                                                                                        ? 'none'
                                                                                                        : isSelectedCell
                                                                                                            ? 'none'
                                                                                                            : 'none',
                                                                                                mb: 0.5,
                                                                                                position: 'relative',
                                                                                            }}
                                                                                        >
                                                                                            <Tooltip title={`${disc.description} - Prof. ${disc.professor1.name}`}>
                                                                                                <Typography
                                                                                                    variant="caption"
                                                                                                    sx={{
                                                                                                        fontWeight: 'bold',
                                                                                                        color: '#1b5e20',
                                                                                                    }}
                                                                                                >
                                                                                                    {disc.code}
                                                                                                </Typography>
                                                                                            </Tooltip>
                                                                                            <Typography
                                                                                                variant="caption"
                                                                                                sx={{
                                                                                                    color: '#424242',
                                                                                                    fontWeight: 'normal',
                                                                                                }}
                                                                                            >
                                                                                                {disc.professor1.initials}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                    )
                                                                                )}
                                                                            </TableCell>
                                                                        </Tooltip>
                                                                    );
                                                                })}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                        {disciplineLegend.length > 0 && (
                                            <Box sx={{ mt: 3, bgcolor: '#f5f5f5', borderRadius: '8px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                                <Box sx={{ p: 2, overflowX: 'auto', maxWidth: '100%' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                                                        Legenda:
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        {disciplineLegend.map((item, index) => (
                                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mr: 0.5 }}>
                                                                    {item.code}:
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: '#555', mr: 1 }}>
                                                                    {item.description}
                                                                </Typography>
                                                                {renderProfessorInfo(
                                                                    item.professorName,
                                                                    item.preferences,
                                                                    item.observation,
                                                                    () => handleOpenObservationsDialog(
                                                                        item.professorName,
                                                                        typeof item.observation === 'object' ? item.observation.observation || '' : item.observation || ''
                                                                    )
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
                })}
            </Grid>
        </Box>
    );
};

export default CourseClassSection;