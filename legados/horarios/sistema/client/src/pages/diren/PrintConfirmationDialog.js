import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PrintConfirmationDialog = ({
    open,
    onClose,
    scheduleData,
    daysOfWeek,
    selectedCourse,
    selectedShift,
    calendarName,
    setAlert,
    mapDisciplinesToGrid,
    hoursData,
    shiftsData
}) => {
    const getSemesterNumber = (code) => {
        const match = code.match(/S(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
    };

    const getCourseCode = (code) => {
        const match = code.match(/-\s*([A-Z]+)\s*-/i);
        return match ? match[1] : '';
    };

    const isIntegralCourse = (classItem, shiftsData) => {
        const matutinoShift = shiftsData.find(shift => shift.name === 'Matutino');
        const vespertinoShift = shiftsData.find(shift => shift.name === 'Vespertino');
        if (!matutinoShift || !vespertinoShift) return false;
        return classItem.turnIds.includes(matutinoShift.id) && classItem.turnIds.includes(vespertinoShift.id);
    };

    const handlePrintSchedule = () => {
        try {
            if (!scheduleData.length || !daysOfWeek.length || !shiftsData.length) {
                setAlert({
                    message: 'Nenhum dado de horário, dias da semana ou turnos disponível para impressão.',
                    type: 'error',
                });
                return;
            }

            const doc = new jsPDF({ orientation: 'landscape', format: 'a0' });
            let yOffset = 15;
            const pageCenterX = doc.internal.pageSize.getWidth() / 2;
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;

            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text('Horários Gerados', pageCenterX, yOffset, { align: 'center' });
            yOffset += 15;

            doc.setFontSize(26);
            doc.setFont('helvetica', 'normal');
            doc.text(calendarName, pageCenterX, yOffset, { align: 'center' });
            yOffset += 15;

            const now = new Date();
            const dataFormatada = now.toLocaleDateString('pt-BR');
            const horaFormatada = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Data/Hora:', margin, yOffset);
            doc.setFont('helvetica', 'normal');
            doc.text(`${dataFormatada} ${horaFormatada}`, margin + doc.getTextWidth('Data/Hora:') + 3, yOffset);
            yOffset += 20;

            const filteredData = scheduleData.filter(
                (course) => !selectedCourse || course.id === selectedCourse.id
            );

            if (!filteredData.length) {
                setAlert({
                    message: 'Nenhum curso selecionado para impressão.',
                    type: 'warning',
                });
                return;
            }

            const shiftOrder = ['Matutino', 'Vespertino', 'Noturno'];
            const shifts = selectedShift
                ? [selectedShift]
                : shiftsData.sort((a, b) =>
                    shiftOrder.indexOf(a.name) - shiftOrder.indexOf(b.name)
                );

            const filteredShifts = shifts.filter(shift => {
                const shiftClasses = filteredData.flatMap(course =>
                    course.classes.filter(classItem =>
                        classItem.turnIds.includes(shift.id)
                    )
                );
                return shiftClasses.length > 0;
            });

            if (!filteredShifts.length) {
                setAlert({
                    message: 'Nenhum turno com horários disponíveis para impressão.',
                    type: 'warning',
                });
                const sanitizedFileName = calendarName.replace(/[^a-zA-Z0-9]/g, '_');
                doc.save(`horarios_${sanitizedFileName}.pdf`);
                onClose();
                return;
            }

            const disciplineLegend = new Map();
            const professorLegend = new Map();

            filteredShifts.forEach(shift => {
                const isMatutino = shift.name === 'Matutino';
                const isVespertino = shift.name === 'Vespertino';
                const isNoturno = shift.name === 'Noturno';
                const headerColor = isMatutino
                    ? [255, 245, 157]
                    : isVespertino
                        ? [240, 255, 240]
                        : [187, 222, 251];

                const shiftClasses = filteredData.flatMap(course =>
                    course.classes.filter(classItem =>
                        classItem.turnIds.includes(shift.id)
                    )
                );

                const groupedClasses = shiftClasses.reduce((acc, classItem) => {
                    const courseCode = getCourseCode(classItem.code);
                    if (!acc[courseCode]) {
                        acc[courseCode] = [];
                    }
                    acc[courseCode].push(classItem);
                    return acc;
                }, {});

                const integralClasses = [];
                const normalClasses = [];

                Object.keys(groupedClasses).forEach(courseCode => {
                    const sortedCourseClasses = groupedClasses[courseCode]
                        .sort((a, b) => getSemesterNumber(a.code) - getSemesterNumber(b.code));
                    const isCourseIntegral = sortedCourseClasses.some(classItem =>
                        isIntegralCourse(classItem, shiftsData)
                    );
                    if (isCourseIntegral) {
                        integralClasses.push(...sortedCourseClasses);
                    } else {
                        normalClasses.push(...sortedCourseClasses);
                    }
                });

                integralClasses.sort((a, b) => {
                    const courseA = getCourseCode(a.code);
                    const courseB = getCourseCode(b.code);
                    return courseA.localeCompare(courseB);
                });
                normalClasses.sort((a, b) => {
                    const courseA = getCourseCode(a.code);
                    const courseB = getCourseCode(b.code);
                    return courseA.localeCompare(courseB);
                });

                const sortedClasses = [...integralClasses, ...normalClasses];

                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text(`Turno: ${shift.name}`, margin, yOffset);
                yOffset += 10;

                const hours = hoursData[shift.id]?.sort((a, b) => a.hourStart.localeCompare(b.hourStart)) || [];

                const totalWidth = doc.internal.pageSize.getWidth() - 2 * margin - 60;
                const classColumnWidth = Math.max(50, totalWidth / sortedClasses.length);

                daysOfWeek.forEach(day => {
                    const relevantHours = hours.filter(slot =>
                        sortedClasses.some(classItem => {
                            const { grid } = mapDisciplinesToGrid(classItem.disciplines, classItem.turnIds);
                            return grid[day.name]?.[slot.hourStart]?.length > 0;
                        })
                    );

                    if (!relevantHours.length) {
                        return;
                    }

                    doc.setFontSize(23);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${day.name}`, pageCenterX, yOffset, { align: 'center' });
                    yOffset += 8;

                    const tableData = relevantHours.map(slot => {
                        const row = [slot.hourStart.substring(0, 5)];
                        sortedClasses.forEach(classItem => {
                            const { grid: classScheduleGrid, uniqueDisciplineDetails } = mapDisciplinesToGrid(classItem.disciplines, classItem.turnIds);
                            const disciplines = classScheduleGrid[day.name]?.[slot.hourStart] || [];
                            const cellContent = disciplines.map(d => {
                                if (d.id !== 'unallocated') {
                                    disciplineLegend.set(d.code, {
                                        code: d.code,
                                        description: d.description
                                    });
                                    professorLegend.set(d.professorShort, {
                                        code: d.professorShort,
                                        professorName: d.professorName || 'N/A'
                                    });
                                    return `${d.code}-${d.professorShort}`;
                                }
                                return '-';
                            }).join('\n\n');
                            row.push(cellContent);
                        });
                        return row;
                    });

                    autoTable(doc, {
                        startY: yOffset,
                        head: [['Horário', ...sortedClasses.map(cls => cls.code)]],
                        body: tableData,
                        theme: 'grid',
                        styles: {
                            fontSize: 18,
                            cellPadding: 6,
                            halign: 'center',
                            valign: 'middle',
                            lineWidth: 0.5,
                            lineColor: [200, 200, 200],
                        },
                        headStyles: {
                            fillColor: headerColor,
                            textColor: [0, 0, 0],
                            fontSize: 18,
                            halign: 'center'
                        },
                        bodyStyles: {
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0]
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        margin: { top: margin, left: margin, right: margin },
                        columnStyles: {
                            0: { cellWidth: 60, halign: 'center' },
                            ...sortedClasses.reduce((acc, _, index) => ({
                                ...acc,
                                [index + 1]: { cellWidth: classColumnWidth }
                            }), {})
                        }
                    });

                    yOffset = doc.lastAutoTable.finalY + 10;

                    if (yOffset + 50 > pageHeight - margin) {
                        doc.addPage();
                        yOffset = 15;
                    }
                });

                yOffset += 15;
            });

            if (disciplineLegend.size > 0 || professorLegend.size > 0) {
                if (disciplineLegend.size > 0) {
                    doc.addPage();
                    yOffset = 15;

                    doc.setFontSize(20);
                    doc.text('Legenda de Disciplinas', pageCenterX, yOffset, { align: 'center' });
                    yOffset += 10;

                    const disciplineLegendArray = Array.from(disciplineLegend.values())
                        .sort((a, b) => a.code.localeCompare(b.code))
                        .map(item => [item.code, item.description]);

                    const totalLegendWidth = doc.internal.pageSize.getWidth() - 2 * margin;
                    const tableWidth = totalLegendWidth * 0.25;
                    const gapBetweenColumns = 10;
                    const maxColumns = Math.floor(totalLegendWidth / (tableWidth + gapBetweenColumns));
                    const disciplinesPerColumn = Math.ceil(disciplineLegendArray.length / maxColumns);

                    const columns = [];
                    for (let i = 0; i < maxColumns; i++) {
                        const start = i * disciplinesPerColumn;
                        const end = start + disciplinesPerColumn;
                        columns.push(disciplineLegendArray.slice(start, end));
                    }

                    columns.forEach((columnData, index) => {
                        if (columnData.length > 0) {
                            autoTable(doc, {
                                startY: yOffset,
                                head: [['Código', 'Disciplina']],
                                body: columnData,
                                theme: 'grid',
                                styles: { fontSize: 14, cellPadding: 2, halign: 'left' },
                                headStyles: {
                                    fillColor: [46, 125, 50],
                                    textColor: [255, 255, 255],
                                    fontSize: 12,
                                    halign: 'center'
                                },
                                bodyStyles: {
                                    fillColor: [255, 255, 255],
                                    textColor: [0, 0, 0]
                                },
                                alternateRowStyles: {
                                    fillColor: [245, 245, 245]
                                },
                                margin: {
                                    top: margin,
                                    left: margin + index * (tableWidth + gapBetweenColumns),
                                    right: margin
                                },
                                columnStyles: {
                                    0: { cellWidth: tableWidth * 0.15, halign: 'center' },
                                    1: { cellWidth: tableWidth * 0.60, overflow: 'linebreak', halign: 'left' }
                                }
                            });
                        }
                    });

                    yOffset = doc.lastAutoTable.finalY + 10;
                }
                if (professorLegend.size > 0) {
                    doc.addPage();
                    yOffset = 15;

                    doc.setFontSize(20);
                    doc.text('Legenda de Professores', pageCenterX, yOffset, { align: 'center' });
                    yOffset += 10;

                    const professorLegendArray = Array.from(professorLegend.values())
                        .sort((a, b) => a.code.localeCompare(b.code))
                        .map(item => [item.code, item.professorName]);

                    const totalLegendWidth = doc.internal.pageSize.getWidth() - 2 * margin;
                    const tableWidth = totalLegendWidth * 0.25;
                    const gapBetweenColumns = 10;
                    const maxColumns = Math.floor(totalLegendWidth / (tableWidth + gapBetweenColumns));
                    const professorsPerColumn = Math.ceil(professorLegendArray.length / maxColumns);

                    const columns = [];
                    for (let i = 0; i < maxColumns; i++) {
                        const start = i * professorsPerColumn;
                        const end = start + professorsPerColumn;
                        columns.push(professorLegendArray.slice(start, end));
                    }

                    columns.forEach((columnData, index) => {
                        if (columnData.length > 0) {
                            autoTable(doc, {
                                startY: yOffset,
                                head: [['Código', 'Professor']],
                                body: columnData,
                                theme: 'grid',
                                styles: { fontSize: 14, cellPadding: 2, halign: 'left' },
                                headStyles: {
                                    fillColor: [46, 125, 50],
                                    textColor: [255, 255, 255],
                                    fontSize: 12,
                                    halign: 'center'
                                },
                                bodyStyles: {
                                    fillColor: [255, 255, 255],
                                    textColor: [0, 0, 0]
                                },
                                alternateRowStyles: {
                                    fillColor: [245, 245, 245]
                                },
                                margin: {
                                    top: margin,
                                    left: margin + index * (tableWidth + gapBetweenColumns),
                                    right: margin
                                },
                                columnStyles: {
                                    0: { cellWidth: tableWidth * 0.15, halign: 'center' },
                                    1: { cellWidth: tableWidth * 0.60, overflow: 'linebreak', halign: 'left' }
                                }
                            });
                        }
                    });

                    yOffset = doc.lastAutoTable.finalY + 10;
                }
            }

            const sanitizedFileName = calendarName.replace(/[^a-zA-Z0-9]/g, '_');
            doc.save(`horarios_${sanitizedFileName}.pdf`);
            setAlert({
                message: 'PDF gerado com sucesso.',
                type: 'success',
            });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            setAlert({
                message: `Erro ao gerar o PDF: ${error.message}. Verifique se os dados estão completos e tente novamente.`,
                type: 'error',
            });
        } finally {
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ color: '#2e7d32', textAlign: 'center' }}>
                Confirmar Impressão
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ textAlign: 'center', color: '#333' }}>
                    Deseja gerar e baixar o PDF com os horários do calendário <strong>{calendarName}</strong> no formato horizontal (A0)?
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                        backgroundColor: 'white',
                        '&:hover': {
                            backgroundColor: '#ffebee',
                            borderColor: '#b71c1c',
                        },
                        textTransform: 'none',
                        minWidth: '100px',
                        cursor: 'pointer',
                    }}
                >
                    Não
                </Button>
                <Button
                    onClick={handlePrintSchedule}
                    variant="contained"
                    sx={{
                        backgroundColor: '#2e7d32',
                        '&:hover': { backgroundColor: '#1b5e20' },
                        textTransform: 'none',
                        minWidth: '100px',
                        cursor: 'pointer',
                        ml: 2,
                    }}
                >
                    Sim
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PrintConfirmationDialog;