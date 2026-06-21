import { Op } from 'sequelize';
import db from '../models/index.js';
import GeneticAlgorithmConstructor from 'geneticalgorithm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const metricsDir = path.resolve(__dirname, '../../client/src/metrics');

const HourGridController = {
    async generateHour(req, res) {
        const startTime = performance.now();
        try {
            // Fetch data from the database
            const professorsWithPreferences = await db.User.findAll({
                include: [
                    {
                        model: db.DayOfWeek,
                        as: 'prefsDays',
                        attributes: ['name'],
                        through: { attributes: ['observation'] },
                    },
                    {
                        model: db.PrefsDisciplines,
                        required: false,
                        as: 'disciplinesPrefered',
                        attributes: ['userId', 'disciplineId', 'semesterId'],
                    },
                ],
                where: {
                    role: 'Professor',
                },
            });
            const allTimeSlots = await db.Hours.findAll({
                attributes: ['id', 'hourStart', 'hourEnd', 'turnId'],
            });
            const maxHoursPerTeacher = 14;
            const days = await db.DayOfWeek.findAll({
                attributes: ['id', 'name'],
            });
            const restrictedMorningSlots = ['07:20', '08:20'];
            const restrictedEveningSlots = ['20:20', '21:20'];
            const dayOrder = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
            const dayIndexMap = {};
            days.forEach((day, index) => {
                dayIndexMap[day.name] = index;
            });
            if (professorsWithPreferences.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No professors found in the database',
                });
            }
            if (allTimeSlots.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No time slots found in the database',
                });
            }
            if (days.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No days of the week found in the database',
                });
            }
            const { calendarId } = req.params;
            const existingClasses = await db.Classes.findAll({
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                        attributes: ['id', 'name', 'code'],
                        required: true,
                        include: [
                            {
                                model: db.Semester,
                                as: 'semesters',
                                where: { number: [db.Sequelize.col('Classes.semester')] },
                                required: true,
                                through: { attributes: [] },
                                attributes: ['id', 'number'],
                                include: [
                                    {
                                        model: db.Discipline,
                                        as: 'disciplines',
                                        attributes: ['id', 'name', 'workload', 'code', 'credit'],
                                        required: true,
                                        include: [
                                            {
                                                model: db.User,
                                                attributes: ['id', 'name', 'nameCode'],
                                                as: 'teachersPreferences',
                                                required: true,
                                                include: [
                                                    {
                                                        model: db.DayOfWeek,
                                                        as: 'prefsDays',
                                                        required: true,
                                                        attributes: ['id', 'name'],
                                                        through: { attributes: ['observation'] },
                                                        order: [['id', 'ASC']]
                                                    },
                                                ],
                                                through: {
                                                    attributes: [],
                                                    where: {
                                                        userId: { [Op.ne]: '' },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        model: db.SemesterClass,
                                        as: 'semesterClasses',
                                        required: true,
                                        where: { planning: true },
                                        attributes: []
                                    }
                                ],
                            },
                            {
                                model: db.TypeLearn,
                                as: 'typeLearn',
                                required: true,
                                attributes: ['id', 'name'],
                            },
                        ],
                    },
                    {
                        model: db.Calendar,
                        as: 'calendar',
                        attributes: ['id', 'name'],
                        where: {
                            active: true,
                            id: calendarId,
                        },
                    },
                    {
                        model: db.Turn,
                        as: 'turn',
                        attributes: ['id', 'name'],
                    },
                ],
                order: [
                    [{ model: db.Course, as: 'course' }, 'name', 'ASC'],
                    [
                        { model: db.Course, as: 'course' },
                        { model: db.Semester, as: 'semesters' },
                        'number',
                        'ASC',
                    ],
                ],
            });
            if (existingClasses.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'No classes found with planning for the specified semester',
                });
            }
            const professors = professorsWithPreferences.map((p) => ({
                id: p.id,
                name: p.name,
                nameCode: p.nameCode,
                preferredDisciplines: p.disciplinesPrefered
                    ? p.disciplinesPrefered.map((dp) => dp.disciplineId)
                    : [],
                preferences: p.prefsDays.map((dp) => dp.name),
            }));
            const classesByCourseAndSemester = {};
            existingClasses.forEach((cls) => {
                const courseId = cls.course.id;
                const semesterNumber = cls.course.semesters[0].number;
                if (!classesByCourseAndSemester[courseId]) {
                    classesByCourseAndSemester[courseId] = {
                        name: cls.course.name,
                        code: cls.course.code || cls.course.name.slice(0, 3).toUpperCase(),
                        semesters: {},
                    };
                }
                if (!classesByCourseAndSemester[courseId].semesters[semesterNumber]) {
                    classesByCourseAndSemester[courseId].semesters[semesterNumber] = {
                        classId: cls.id,
                        turnId: cls.turn.id,
                        disciplines: cls.course.semesters[0].disciplines.map((d) => ({
                            id: d.id,
                            name: d.name,
                            code: d.code,
                            requiredHours: d.workload || 1,
                            sessionsPerWeek: d.credit,
                        })),
                    };
                }
            });
            // Function to check for conflicts within a timetable
            function reportConflicts(phenotype) {
                const allAssignments = phenotype.assignments || [];
                const conflicts = [];
                const professorTimeMap = {};
                const slotProfessorMap = {};
                const disciplineDayCount = {};
                const professorDaySlots = {};
                allAssignments.forEach((a) => {
                    if (!a.time || typeof a.time !== 'object') {
                        conflicts.push({
                            type: 'invalid_assignment',
                            message: `Invalid time slot for assignment: ${JSON.stringify(a)}`,
                        });
                        return;
                    }
                    if (a.classId !== phenotype.classId) {
                        conflicts.push({
                            type: 'wrong_class',
                            message: `Assignment for class ${a.classId} found in timetable for class ${phenotype.classId}`,
                        });
                    }
                    const hourStart = a.time.hourStart;
                    const key = `${a.professorId}-${a.day}-${hourStart}`;
                    professorTimeMap[key] = (professorTimeMap[key] || []).concat(a);
                    if (professorTimeMap[key].length > 1) {
                        conflicts.push({
                            type: 'professor_double_booking',
                            message: `Professor ${a.professorName} double-booked on ${a.day} at ${hourStart}: ${professorTimeMap[key]
                                .map((x) => x.disciplineName)
                                .join(', ')}`,
                        });
                    }
                    const slotKey = `${a.classId}-${a.day}-${hourStart}`;
                    if (!slotProfessorMap[slotKey]) {
                        slotProfessorMap[slotKey] = a.professorId;
                    } else if (slotProfessorMap[slotKey] !== a.professorId) {
                        conflicts.push({
                            type: 'multiple_professors',
                            message: `Multiple professors assigned to class ${a.classId} on ${a.day} at ${hourStart}`,
                        });
                    }
                    const disciplineKey = `${a.professorId}-${a.disciplineId}-${a.day}`;
                    disciplineDayCount[disciplineKey] = (disciplineDayCount[disciplineKey] || 0) + 1;
                    if (disciplineDayCount[disciplineKey] > 2) {
                        conflicts.push({
                            type: 'too_many_classes_per_day',
                            message: `Professor ${a.professorName} has ${disciplineDayCount[disciplineKey]} classes of ${a.disciplineName} on ${a.day}`,
                        });
                    }
                    // Track slots by professor and day
                    if (!professorDaySlots[a.professorId]) {
                        professorDaySlots[a.professorId] = {};
                    }
                    if (!professorDaySlots[a.professorId][a.day]) {
                        professorDaySlots[a.professorId][a.day] = [];
                    }
                    professorDaySlots[a.professorId][a.day].push(a.time.hourStart);
                });
                // Check for morning-evening conflicts across consecutive days
                Object.entries(professorDaySlots).forEach(([professorId, days]) => {
                    Object.entries(days).forEach(([day, slots]) => {
                        const currentDayIndex = dayIndexMap[day];
                        if (currentDayIndex === undefined || currentDayIndex === 0) return; // Skip if no previous day
                        const previousDay = dayOrder[currentDayIndex - 1];
                        const previousSlots = professorDaySlots[professorId][previousDay] || [];
                        const hasEveningPrevious = previousSlots.some(slot => restrictedEveningSlots.includes(slot));
                        const hasMorningCurrent = slots.some(slot => restrictedMorningSlots.includes(slot));
                        if (hasEveningPrevious && hasMorningCurrent) {
                            conflicts.push({
                                type: 'morning_evening_conflict',
                                message: `Professor ${professorId} assigned to early morning (${restrictedMorningSlots.join(', ')}) on ${day} and late evening (${restrictedEveningSlots.join(', ')}) on previous day ${previousDay}`,
                            });
                        }
                    });
                });
                const assignmentsByDiscipline = {};
                allAssignments.forEach((a) => {
                    assignmentsByDiscipline[a.disciplineId] =
                        (assignmentsByDiscipline[a.disciplineId] || 0) + 1;
                });
                const semesterData = Object.values(classesByCourseAndSemester)
                    .flatMap(c => Object.values(c.semesters))
                    .find(s => s.classId === phenotype.classId);
                if (semesterData) {
                    semesterData.disciplines.forEach((d) => {
                        if ((assignmentsByDiscipline[d.id] || 0) < d.sessionsPerWeek) {
                            conflicts.push({
                                type: 'insufficient_sessions',
                                message: `Discipline ${d.name} has ${assignmentsByDiscipline[d.id] || 0} sessions, required ${d.sessionsPerWeek}`,
                            });
                        }
                    });
                }
                return conflicts;
            }
            // Function to check if timetable meets weekly requirements
            function meetsWeeklyRequirements(timetable, semesterDisciplines) {
                const assignmentsByDiscipline = {};
                (timetable.assignments || []).forEach((a) => {
                    assignmentsByDiscipline[a.disciplineId] =
                        (assignmentsByDiscipline[a.disciplineId] || 0) + 1;
                });
                return semesterDisciplines.every(
                    (d) => (assignmentsByDiscipline[d.id] || 0) >= d.sessionsPerWeek
                );
            }
            // Function to get sorted time slots, filtered by class turn
            function getSortedTimeSlots(turnTimeSlots, classId) {
                const semesterData = Object.values(classesByCourseAndSemester)
                    .flatMap(c => Object.values(c.semesters))
                    .find(s => s.classId === classId);
                const classTurnId = semesterData ? semesterData.turnId : null;
                const filteredTimeSlots = classTurnId
                    ? turnTimeSlots.filter(ts => ts.turnId === classTurnId)
                    : turnTimeSlots;
                return filteredTimeSlots.sort((a, b) => {
                    const timeA = a.hourStart.split(':').map(Number);
                    const timeB = b.hourStart.split(':').map(Number);
                    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
                });
            }
            // Function to check if two slots are consecutive
            function areConsecutiveSlots(slot1, slot2, sortedTimeSlots) {
                const index1 = sortedTimeSlots.findIndex(t => t.id === slot1.id);
                const index2 = sortedTimeSlots.findIndex(t => t.id === slot2.id);
                return index2 === index1 + 1;
            }
            // Generate phenotype with relaxed constraints and consecutive session prioritization
            function generatePhenotype(classId, semesterDisciplines, turnTimeSlots, strict = true) {
                const assignments = [];
                const sortedTimeSlots = getSortedTimeSlots(turnTimeSlots, classId);
                const professorSessions = {};
                const disciplineDayCount = {};
                const usedSlots = new Set();
                if (sortedTimeSlots.length === 0) {
                    console.error(`No time slots available for classId ${classId}`);
                    return { classId, assignments: [] };
                }
                let semesterData = null;
                let courseType = null;
                for (const course of Object.values(classesByCourseAndSemester)) {
                    semesterData = Object.values(course.semesters).find(s => s.classId === classId);
                    if (semesterData) {
                        const classData = existingClasses.find(cls => cls.id === classId);
                        courseType = classData?.course?.typeLearn?.name || 'Unknown';
                        break;
                    }
                }
                if (!semesterData) {
                    console.warn(`No semester data found for classId ${classId}, using provided disciplines`);
                    courseType = 'Unknown';
                }
                const requiresTwoSlots = ['Graduação', 'Técnico Subsequente', 'Técnico Concomitante', 'Pós-Graduação'].includes(courseType);
                const preferTwoSlots = ['Técnico Integrado', 'EJA'].includes(courseType);
                let validDisciplines = semesterDisciplines.filter((ds) =>
                    semesterData.disciplines.some(d => d.id === ds.id)
                );
                if (validDisciplines.length === 0) {
                    console.warn(`No valid disciplines found for classId ${classId}`);
                    return { classId, assignments: [] };
                }
                const totalSessions = validDisciplines.reduce(
                    (sum, ds) => sum + (ds.sessionsPerWeek || 1),
                    0
                );
                const availableSlots = days.length * sortedTimeSlots.length;
                if (requiresTwoSlots && totalSessions > availableSlots) {
                    console.warn(`Not enough slots for classId ${classId}: ${totalSessions} required, ${availableSlots} available`);
                    return { classId, assignments: [] };
                }
                validDisciplines.forEach((ds) => {
                    const sessions = ds.sessionsPerWeek || 1;
                    let eligibleProfessors = professors.filter((p) =>
                        p.preferredDisciplines.includes(ds.id)
                    // p.preferredDisciplines.some(preference => preference.disciplineId === ds.id && preference.semesterId === semesterData.id)
                    );
                    if (eligibleProfessors.length === 0) {
                        console.warn(
                            `No preferred professors for ${ds.name} (ID: ${ds.id}), using all professors`
                        );
                        eligibleProfessors = [...professors];
                    }
                    for (let i = 0; i < sessions; i++) {
                        const professor =
                            eligibleProfessors[Math.floor(Math.random() * eligibleProfessors.length)];
                        professorSessions[professor.id] =
                            (professorSessions[professor.id] || 0) + 1;
                    }
                });
                // Updated assignSessions function with logging:
                function assignSessions(ds, professor, allowedDays, sessionsToAssign, recursionDepth = 0) {
                    if (recursionDepth > 5) {
                        console.error(`Max recursion depth reached for ${ds.name}`);
                        return 0;
                    }
                    let sessionsAssigned = 0;
                    const shuffledDays = [...allowedDays].sort(() => Math.random() - 0.5);
                    for (const day of shuffledDays) {
                        if (sessionsAssigned >= sessionsToAssign) break;
                        const disciplineKey = `${professor.id}-${ds.id}-${day}`;
                        if (strict && (disciplineDayCount[disciplineKey] || 0) >= 2) {
                            console.log(`Skipped day ${day} for ${ds.name}: Already at max classes per day (2+)`); // NEW: Log skip reason
                            continue;
                        }
                        const professorDaySlotsForDay = assignments
                            .filter(a => a.professorId === professor.id && a.day === day)
                            .map(a => a.time.hourStart);
                        const currentDayIndex = dayIndexMap[day];
                        let isMorningRestricted = false;
                        if (currentDayIndex > 0) {
                            const previousDay = dayOrder[currentDayIndex - 1];
                            const previousDaySlots = assignments
                                .filter(a => a.professorId === professor.id && a.day === previousDay)
                                .map(a => a.time.hourStart);
                            isMorningRestricted = previousDaySlots.some(slot => restrictedEveningSlots.includes(slot));
                        }
                        if (requiresTwoSlots || (preferTwoSlots && sessionsToAssign >= 2)) {
                            let currentIndex = 0;
                            while (currentIndex < sortedTimeSlots.length - 1 && sessionsAssigned < sessionsToAssign) {
                                const time1 = sortedTimeSlots[currentIndex];
                                const time2 = sortedTimeSlots[currentIndex + 1];
                                const slotKey1 = `${classId}-${day}-${time1.hourStart}`;
                                const slotKey2 = `${classId}-${day}-${time2.hourStart}`;
                                if (isMorningRestricted && (restrictedMorningSlots.includes(time1.hourStart) || restrictedMorningSlots.includes(time2.hourStart))) {
                                    console.log(`Skipped slots ${time1.hourStart}-${time2.hourStart} on ${day}: Morning restricted after evening previous day`); // NEW: Log
                                    currentIndex++;
                                    continue;
                                }
                                if (
                                    !usedSlots.has(slotKey1) &&
                                    !usedSlots.has(slotKey2) &&
                                    !professorDaySlotsForDay.includes(time1.hourStart) &&
                                    !professorDaySlotsForDay.includes(time2.hourStart) &&
                                    areConsecutiveSlots(time1, time2, sortedTimeSlots)
                                ) {
                                    assignments.push({
                                        classId,
                                        disciplineId: ds.id,
                                        disciplineName: ds.name,
                                        professorId: professor.id,
                                        professorName: professor.name,
                                        professorNameCode: professor.nameCode,
                                        day,
                                        time: { ...time1.dataValues },
                                    });
                                    assignments.push({
                                        classId,
                                        disciplineId: ds.id,
                                        disciplineName: ds.name,
                                        professorId: professor.id,
                                        professorName: professor.name,
                                        professorNameCode: professor.nameCode,
                                        day,
                                        time: { ...time2.dataValues },
                                    });
                                    usedSlots.add(slotKey1);
                                    usedSlots.add(slotKey2);
                                    professorDaySlotsForDay.push(time1.hourStart, time2.hourStart);
                                    disciplineDayCount[disciplineKey] =
                                        (disciplineDayCount[disciplineKey] || 0) + 2;
                                    sessionsAssigned += 2;
                                } else {
                                    console.log(`Skipped slots ${time1.hourStart}-${time2.hourStart} on ${day}: Slot used, professor busy, or not consecutive`); // NEW: Log skip
                                }
                                currentIndex++;
                            }
                        }
                        // Similar logging for single-slot block...
                        // (Add console.log for skips in the single-slot while loop)
                        // At end, if sessionsAssigned == 0, log summary:
                        if (sessionsAssigned === 0) {
                            console.warn(`No sessions assigned for ${ds.name} on day ${day}. Used slots: ${Array.from(usedSlots).filter(s => s.startsWith(`${classId}-${day}-`)).join(', ')}. Professor busy slots: ${professorDaySlotsForDay.join(', ')}`);
                        }
                    }
                    return sessionsAssigned;
                }
                // Inside generatePhenotype, replace the validDisciplines.forEach block with this:
                validDisciplines.forEach((ds) => {
                    let sessions = ds.sessionsPerWeek || 1;
                    let sessionsAssigned = 0;
                    let eligibleProfessors = professors.filter((p) =>
                        p.preferredDisciplines.includes(ds.id)
                    );
                    if (eligibleProfessors.length === 0) {
                        eligibleProfessors = [...professors];
                    }
                    const maxSessionsPerProfessor = Math.ceil(sessions / eligibleProfessors.length);
                    const professorAssignments = {};
                    let attempts = 0; // NEW: Track attempts to prevent infinite loop
                    const maxAttempts = 100; // NEW: Arbitrary limit; adjust as needed
                    while (sessionsAssigned < sessions && attempts < maxAttempts) {
                        attempts++;
                        const professor =
                            eligibleProfessors[Math.floor(Math.random() * eligibleProfessors.length)];
                        const currentProfessorSessions = professorAssignments[professor.id] || 0;
                        if (currentProfessorSessions >= maxSessionsPerProfessor) continue;
                        const allowedDays =
                            professor.preferences.length > 0
                                ? professor.preferences
                                : days.map((d) => d.name);
                        const sessionsToAssign = Math.min(
                            sessions - sessionsAssigned,
                            requiresTwoSlots ? 2 : preferTwoSlots ? Math.min(sessions - sessionsAssigned, 2) : 1
                        );
                        console.log(`Attempt ${attempts}: Assigning ${sessionsToAssign} sessions for ${ds.name} to professor ${professor.name} on days: ${allowedDays.join(', ')}`); // NEW: Debug log
                        const assigned = assignSessions(ds, professor, allowedDays, sessionsToAssign);
                        sessionsAssigned += assigned;
                        professorAssignments[professor.id] = (professorAssignments[professor.id] || 0) + assigned;
                        if (sessionsAssigned < sessions && strict) {
                            console.warn(`No valid slot for ${ds.name}, trying non-strict single-slot assignment`);
                            const remainingSessions = sessions - sessionsAssigned;
                            const assignedNonStrict = assignSessions(ds, professor, allowedDays, remainingSessions, 1);
                            sessionsAssigned += assignedNonStrict;
                            professorAssignments[professor.id] = (professorAssignments[professor.id] || 0) + assignedNonStrict;
                        }
                        if (sessionsAssigned < sessions) {
                            console.error(`Failed to assign ${ds.name}, using random single slot`);
                            if (sessionsAssigned < sessions) {
                                console.error(`Failed to assign ${ds.name}, using random single slot`);
                                for (const day of days.map(d => d.name)) {
                                    for (const time of sortedTimeSlots) {
                                        const slotKey = `${classId}-${day}-${time.hourStart}`;
                                        const currentDayIndex = dayIndexMap[day];
                                        let isMorningRestricted = false;
                                        if (currentDayIndex > 0) {
                                            const previousDay = dayOrder[currentDayIndex - 1];
                                            const previousDaySlots = assignments
                                                .filter(a => a.professorId === professor.id && a.day === previousDay)
                                                .map(a => a.time.hourStart);
                                            isMorningRestricted = previousDaySlots.some(slot => restrictedEveningSlots.includes(slot));
                                        }
                                        if (isMorningRestricted && restrictedMorningSlots.includes(time.hourStart)) {
                                            continue;
                                        }
                                        if (!usedSlots.has(slotKey)) {
                                            assignments.push({
                                                classId,
                                                disciplineId: ds.id,
                                                disciplineName: ds.name,
                                                professorId: professor.id,
                                                professorName: professor.name,
                                                professorNameCode: professor.nameCode,
                                                day,
                                                time: { ...time.dataValues },
                                            });
                                            usedSlots.add(slotKey);
                                            const disciplineKey = `${professor.id}-${ds.id}-${day}`;
                                            disciplineDayCount[disciplineKey] =
                                                (disciplineDayCount[disciplineKey] || 0) + 1;
                                            sessionsAssigned++;
                                            professorAssignments[professor.id] =
                                                (professorAssignments[professor.id] || 0) + 1;
                                            break;
                                        }
                                    }
                                    if (sessionsAssigned >= sessions) break;
                                }
                            }
                        }
                    }
                    if (attempts >= maxAttempts) {
                        console.error(`Infinite loop prevented: Max attempts (${maxAttempts}) reached for ${ds.name}. Assigned ${sessionsAssigned}/${sessions} sessions. Possible causes: No free slots, restrictions too tight, or data issues.`);
                        // Optionally: throw new Error(...) or flag for manual review
                    }
                });
                return { classId, assignments };
            }
            // Mutation function with validation
            function mutationFunction(phenotype, strict = true) {
                const newPhenotype = JSON.parse(JSON.stringify(phenotype));
                if (
                    !newPhenotype.assignments ||
                    !Array.isArray(newPhenotype.assignments) ||
                    newPhenotype.assignments.length === 0
                ) {
                    console.warn('Invalid phenotype in mutationFunction');
                    return newPhenotype;
                }
                const semesterData = Object.values(classesByCourseAndSemester)
                    .flatMap(c => Object.values(c.semesters))
                    .find(s => s.classId === newPhenotype.classId);
                const classData = existingClasses.find(cls => cls.id === newPhenotype.classId);
                const courseType = classData?.course?.typeLearn?.name || 'Unknown';
                const requiresTwoSlots = ['Graduação', 'Técnico Subsequente', 'Técnico Concomitante', 'Pós-Graduação'].includes(courseType);
                const preferTwoSlots = ['Técnico Integrado', 'EJA'].includes(courseType);
                const index = Math.floor(Math.random() * newPhenotype.assignments.length);
                const assignment = newPhenotype.assignments[index];
                const disciplineId = assignment.disciplineId;
                let eligibleProfessors = professors.filter((p) =>
                    p.preferredDisciplines.includes(disciplineId)
                );
                if (eligibleProfessors.length === 0) {
                    eligibleProfessors = [...professors];
                }
                const professor = eligibleProfessors[Math.floor(Math.random() * eligibleProfessors.length)];
                const allowedDays =
                    professor.preferences.length > 0
                        ? professor.preferences
                        : days.map((d) => d.name);
                const turnTimeSlots = getSortedTimeSlots(
                    allTimeSlots.filter((ts) => ts.turnId === assignment.time.turnId),
                    newPhenotype.classId
                );
                if (turnTimeSlots.length === 0) {
                    console.error(`No time slots available for turnId ${assignment.time.turnId}`);
                    return newPhenotype;
                }
                const usedSlots = new Set(
                    newPhenotype.assignments
                        .filter((a) => a !== assignment)
                        .map((a) => `${a.classId}-${a.day}-${a.time.hourStart}`)
                );
                const disciplineDayCount = {};
                newPhenotype.assignments
                    .filter((a) => a !== assignment)
                    .forEach((a) => {
                        const disciplineKey = `${a.professorId}-${a.disciplineId}-${a.day}`;
                        disciplineDayCount[disciplineKey] = (disciplineDayCount[disciplineKey] || 0) + 1;
                    });
                let day, time1, time2;
                let assigned = false;
                const professorDaySlots = {};
                newPhenotype.assignments
                    .filter((a) => a.professorId === professor.id && a !== assignment)
                    .forEach(a => {
                        if (!professorDaySlots[a.day]) professorDaySlots[a.day] = [];
                        professorDaySlots[a.day].push(a.time.hourStart);
                    });
                const shuffledDays = [...allowedDays].sort(() => Math.random() - 0.5);
                if (requiresTwoSlots || (preferTwoSlots && strict)) {
                    for (const d of shuffledDays) {
                        const disciplineKey = `${professor.id}-${disciplineId}-${d}`;
                        if (strict && (disciplineDayCount[disciplineKey] || 0) >= 2) continue;
                        const currentDayIndex = dayIndexMap[d];
                        let isMorningRestricted = false;
                        if (currentDayIndex > 0) {
                            const previousDay = dayOrder[currentDayIndex - 1];
                            const previousDaySlots = professorDaySlots[previousDay] || [];
                            isMorningRestricted = previousDaySlots.some(slot => restrictedEveningSlots.includes(slot));
                        }
                        for (let i = 0; i < turnTimeSlots.length - 1; i++) {
                            const t1 = turnTimeSlots[i];
                            const t2 = turnTimeSlots[i + 1];
                            const slotKey1 = `${assignment.classId}-${d}-${t1.hourStart}`;
                            const slotKey2 = `${assignment.classId}-${d}-${t2.hourStart}`;
                            if (
                                !usedSlots.has(slotKey1) &&
                                !usedSlots.has(slotKey2) &&
                                !(professorDaySlots[d] || []).includes(t1.hourStart) &&
                                !(professorDaySlots[d] || []).includes(t2.hourStart) &&
                                areConsecutiveSlots(t1, t2, turnTimeSlots) &&
                                (!isMorningRestricted || (!restrictedMorningSlots.includes(t1.hourStart) && !restrictedMorningSlots.includes(t2.hourStart)))
                            ) {
                                day = d;
                                time1 = t1;
                                time2 = t2;
                                assigned = true;
                                break;
                            }
                        }
                        if (assigned) break;
                    }
                }
                if (!assigned && (preferTwoSlots || !requiresTwoSlots || !strict)) {
                    for (const d of shuffledDays) {
                        const disciplineKey = `${professor.id}-${disciplineId}-${d}`;
                        if (strict && (disciplineDayCount[disciplineKey] || 0) >= 2) continue;
                        const currentDayIndex = dayIndexMap[d];
                        let isMorningRestricted = false;
                        if (currentDayIndex > 0) {
                            const previousDay = dayOrder[currentDayIndex - 1];
                            const previousDaySlots = professorDaySlots[previousDay] || [];
                            isMorningRestricted = previousDaySlots.some(slot => restrictedEveningSlots.includes(slot));
                        }
                        for (const t of turnTimeSlots) {
                            const slotKey = `${assignment.classId}-${d}-${t.hourStart}`;
                            if (
                                !usedSlots.has(slotKey) &&
                                !(professorDaySlots[d] || []).includes(t.hourStart) &&
                                (!isMorningRestricted || !restrictedMorningSlots.includes(t.hourStart))
                            ) {
                                day = d;
                                time1 = t;
                                assigned = true;
                                break;
                            }
                        }
                        if (assigned) break;
                    }
                }
                if (!assigned) {
                    console.error(`Mutation: Failed to assign ${assignment.disciplineName}`);
                    return newPhenotype;
                }
                if (requiresTwoSlots || (preferTwoSlots && strict && time2)) {
                    newPhenotype.assignments[index] = {
                        ...assignment,
                        professorId: professor.id,
                        professorName: professor.name,
                        professorNameCode: professor.nameCode,
                        day,
                        time: { ...time1.dataValues },
                    };
                    if (time2) {
                        const pairedIndex = newPhenotype.assignments.findIndex(
                            (a, i) => i !== index && a.disciplineId === disciplineId && a.day === day
                        );
                        if (pairedIndex !== -1) {
                            newPhenotype.assignments[pairedIndex] = {
                                ...assignment,
                                professorId: professor.id,
                                professorName: professor.name,
                                professorNameCode: professor.nameCode,
                                day,
                                time: { ...time2.dataValues },
                            };
                        } else {
                            newPhenotype.assignments.push({
                                ...assignment,
                                professorId: professor.id,
                                professorName: professor.name,
                                professorNameCode: professor.nameCode,
                                day,
                                time: { ...time2.dataValues },
                            });
                        }
                    }
                } else if (time1?.dataValues) {
                    newPhenotype.assignments[index] = {
                        ...assignment,
                        professorId: professor.id,
                        professorName: professor.name,
                        professorNameCode: professor.nameCode,
                        day,
                        time: { ...time1.dataValues },
                    };
                } else {
                    console.error(`Invalid time slot for ${assignment.disciplineName} in mutation`);
                    return newPhenotype;
                }
                return newPhenotype;
            }
            // Crossover function
            function crossoverFunction(a, b) {
                const newA = JSON.parse(JSON.stringify(a));
                const newB = JSON.parse(JSON.stringify(b));
                if (
                    !newA.assignments ||
                    !newB.assignments ||
                    !Array.isArray(newA.assignments) ||
                    !Array.isArray(newB.assignments)
                ) {
                    console.warn('Invalid phenotype in crossoverFunction');
                    return [newA, newB];
                }
                const index = Math.floor(Math.random() * Math.min(newA.assignments.length, newB.assignments.length));
                newA.assignments = [
                    ...newA.assignments.slice(0, index),
                    ...newB.assignments.slice(index).filter(a => a.classId === newA.classId),
                ];
                newB.assignments = [
                    ...newB.assignments.slice(0, index),
                    ...newA.assignments.slice(index).filter(a => a.classId === newB.classId),
                ];
                return [newA, newB];
            }
            // Fitness function
            function fitnessFunction(phenotype) {
                let fitness = 1000;
                const allAssignments = phenotype.assignments || [];
                if (allAssignments.length === 0) {
                    fitness -= 1000;
                    // console.log('Penalty for empty schedule');
                }
                const professorTimeMap = {};
                const slotProfessorMap = {};
                const disciplineDayCount = {};
                const professorDaySlots = {};
                allAssignments.forEach((a) => {
                    if (!a.time || typeof a.time !== 'object') {
                        fitness -= 500;
                        // console.log('Invalid time slot');
                        return;
                    }
                    if (a.classId !== phenotype.classId) {
                        fitness -= 1000;
                        // console.log(`Wrong classId: ${a.classId} in timetable for ${phenotype.classId}`);
                    }
                    const hourStart = a.time.hourStart;
                    const key = `${a.professorId}-${a.day}-${hourStart}`;
                    professorTimeMap[key] = (professorTimeMap[key] || 0) + 1;
                    if (professorTimeMap[key] > 1) {
                        fitness -= 500;
                        // console.log(`Double-booking: ${a.professorName} at ${hourStart}`);
                    }
                    const slotKey = `${a.classId}-${a.day}-${hourStart}`;
                    if (!slotProfessorMap[slotKey]) {
                        slotProfessorMap[slotKey] = a.professorId;
                    } else if (slotProfessorMap[slotKey] !== a.professorId) {
                        fitness -= 500;
                        // console.log(`Multiple professors in class ${a.classId} at ${hourStart}`);
                    }
                    const disciplineKey = `${a.professorId}-${a.disciplineId}-${a.day}`;
                    disciplineDayCount[disciplineKey] = (disciplineDayCount[disciplineKey] || 0) + 1;
                    if (disciplineDayCount[disciplineKey] > 2) {
                        fitness -= 600;
                        // console.log(
                        // `Too many classes (${disciplineDayCount[disciplineKey]}) of ${a.disciplineName} for ${a.professorName} on ${a.day}`
                        // );
                    }
                    if (!professorDaySlots[a.professorId]) {
                        professorDaySlots[a.professorId] = {};
                    }
                    if (!professorDaySlots[a.professorId][a.day]) {
                        professorDaySlots[a.professorId][a.day] = [];
                    }
                    professorDaySlots[a.professorId][a.day].push(a.time.hourStart);
                });
                Object.entries(professorDaySlots).forEach(([professorId, days]) => {
                    Object.entries(days).forEach(([day, slots]) => {
                        const currentDayIndex = dayIndexMap[day];
                        if (currentDayIndex === undefined || currentDayIndex === 0) return;
                        const previousDay = dayOrder[currentDayIndex - 1];
                        const previousSlots = professorDaySlots[professorId][previousDay] || [];
                        const hasEveningPrevious = previousSlots.some(slot => restrictedEveningSlots.includes(slot));
                        const hasMorningCurrent = slots.some(slot => restrictedMorningSlots.includes(slot));
                        if (hasEveningPrevious && hasMorningCurrent) {
                            fitness -= 600;
                            // console.log(
                            // `Morning-evening conflict: Professor ${professorId} has early morning on ${day} and late evening on ${previousDay}`
                            // );
                        }
                    });
                });
                const assignmentsByDiscipline = {};
                allAssignments.forEach((a) => {
                    assignmentsByDiscipline[a.disciplineId] =
                        (assignmentsByDiscipline[a.disciplineId] || 0) + 1;
                });
                const semesterData = Object.values(classesByCourseAndSemester)
                    .flatMap(c => Object.values(c.semesters))
                    .find(s => s.classId === phenotype.classId);
                if (semesterData) {
                    semesterData.disciplines.forEach((d) => {
                        if ((assignmentsByDiscipline[d.id] || 0) < d.sessionsPerWeek) {
                            fitness -= 600;
                            // console.log(
                            // `Insufficient sessions for ${d.name}: ${assignmentsByDiscipline[d.id] || 0}/${d.sessionsPerWeek}`
                            // );
                        }
                    });
                }
                const professorDays = {};
                allAssignments.forEach((a) => {
                    if (!professorDays[a.professorId]) professorDays[a.professorId] = {};
                    if (!professorDays[a.professorId][a.day]) professorDays[a.professorId][a.day] = [];
                    professorDays[a.professorId][a.day].push(a);
                });
                Object.entries(professorDays).forEach(([profId, days]) => {
                    Object.entries(days).forEach(([day, dayAssignments]) => {
                        if (dayAssignments.length >= 2) {
                            const sortedAssignments = dayAssignments.sort((a, b) => {
                                const timeA = a.time.hourStart.split(':').map(Number);
                                const timeB = b.time.hourStart.split(':').map(Number);
                                return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
                            });
                            let consecutiveCount = 0;
                            const turnTimeSlots = getSortedTimeSlots(
                                allTimeSlots.filter((ts) => ts.turnId === sortedAssignments[0].time.turnId),
                                phenotype.classId
                            );
                            for (let i = 1; i < sortedAssignments.length; i++) {
                                if (
                                    sortedAssignments[i].disciplineId === sortedAssignments[i - 1].disciplineId &&
                                    areConsecutiveSlots(
                                        sortedAssignments[i - 1].time,
                                        sortedAssignments[i].time,
                                        turnTimeSlots
                                    )
                                ) {
                                    consecutiveCount++;
                                }
                            }
                            if (consecutiveCount > 0) {
                                fitness += consecutiveCount * 300;
                            } else {
                                fitness -= 150;
                            }
                        }
                    });
                });
                if (semesterData) {
                    const classData = existingClasses.find(cls => cls.id === phenotype.classId);
                    const courseType = classData?.course?.typeLearn?.name;
                    const requiresTwoSlots = ['Graduação', 'Técnico Subsequente', 'Técnico Concomitante', 'Pós-Graduação'].includes(courseType);
                    if (requiresTwoSlots) {
                        Object.entries(professorDays).forEach(([profId, days]) => {
                            Object.entries(days).forEach(([day, dayAssignments]) => {
                                if (dayAssignments.length >= 2) {
                                    const sortedAssignments = dayAssignments.sort((a, b) => {
                                        const timeA = a.time.hourStart.split(':').map(Number);
                                        const timeB = b.time.hourStart.split(':').map(Number);
                                        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
                                    });
                                    const turnTimeSlots = getSortedTimeSlots(
                                        allTimeSlots.filter((ts) => ts.turnId === sortedAssignments[0].time.turnId),
                                        phenotype.classId
                                    );
                                    for (let i = 1; i < sortedAssignments.length; i++) {
                                        if (
                                            sortedAssignments[i].disciplineId === sortedAssignments[i - 1].disciplineId &&
                                            !areConsecutiveSlots(
                                                sortedAssignments[i - 1].time,
                                                sortedAssignments[i].time,
                                                turnTimeSlots
                                            )
                                        ) {
                                            fitness -= 300;
                                            // console.log(
                                            // `Non-consecutive slots for ${sortedAssignments[i].disciplineName} on ${day}`
                                            // );
                                        }
                                    }
                                }
                            });
                        });
                    }
                }
                const validDays = allAssignments.every((a) => {
                    const profPrefs = professors.find(p => p.id === a.professorId)?.preferences || [];
                    return profPrefs.includes(a.day) || profPrefs.length === 0;
                });
                if (!validDays && allAssignments.length > 0) {
                    fitness -= 600;
                    // console.log('Invalid day preference');
                }
                const professorHours = {};
                professors.forEach((p) => (professorHours[p.id] = 0));
                allAssignments.forEach((a) => {
                    if (a.time && typeof a.time === 'object') {
                        professorHours[a.professorId] += 1;
                    }
                });
                const hoursExceeded = Object.values(professorHours).some(
                    (hours) => hours > maxHoursPerTeacher
                );
                if (hoursExceeded) {
                    fitness -= 600;
                    // console.log('Maximum hours per professor exceeded');
                }
                const avgHours =
                    allAssignments.length > 0 ? allAssignments.length / professors.length : 0;
                const loadPenalty = Object.values(professorHours).reduce(
                    (sum, hours) => sum + Math.abs(hours - avgHours),
                    0
                );
                fitness -= loadPenalty * 20;
                const disciplineDaySpread = {};
                allAssignments.forEach((a) => {
                    const key = `${a.disciplineId}`;
                    disciplineDaySpread[key] = disciplineDaySpread[key] || new Set();
                    disciplineDaySpread[key].add(a.day);
                });
                Object.values(disciplineDaySpread).forEach((days) => {
                    fitness += days.size * 100;
                });
                if (phenotype.classId === '641359cc-ad33-4c0e-8fe4-3adde5c08d01') {
                    const nightSlots = getSortedTimeSlots(allTimeSlots, phenotype.classId);
                    const totalPossibleSlots = days.length * nightSlots.length;
                    const usedSlots = new Set(
                        allAssignments.map((a) => `${a.day}-${a.time.id}`)
                    );
                    if (usedSlots.size >= totalPossibleSlots) {
                        fitness += 400;
                    } else {
                        fitness -= (totalPossibleSlots - usedSlots.size) * 200;
                        // console.log(`Incomplete slot usage for semester 2: ${usedSlots.size}/${totalPossibleSlots}`);
                    }
                }
                return fitness < 0 ? 0 : fitness;
            }
            // Generate HourGrid
            const finalTimetables = {};
            const convergenceData = {};
            let mutationCount = 0;
            let successfulMutationCount = 0;
            for (const [courseId, courseData] of Object.entries(classesByCourseAndSemester)) {
                finalTimetables[courseId] = { name: courseData.name, semesters: {} };
                const semesterNumbers = Object.keys(courseData.semesters).sort((a, b) => parseInt(a) - parseInt(b));
                for (const semesterNumber of semesterNumbers) {
                    const semesterData = courseData.semesters[semesterNumber];
                    const classId = semesterData.classId;
                    const turnTimeSlots = allTimeSlots.filter((ts) => ts.turnId === semesterData.turnId);
                    if (turnTimeSlots.length === 0) continue;
                    // Inicializa histórico de convergência para esta turma
                    const historyKey = `${courseData.name} - ${semesterNumber}º Semestre`;
                    convergenceData[historyKey] = {
                        iterations: [],
                        bestFitness: [],
                        avgFitness: [],
                        validSolutionsFound: 0,
                        finalFitness: null,
                        totalIterations: 0,
                        convergedAt: null,
                        maxEstagnacao: 0
                    };
                    let population = Array(100).fill().map(() =>
                        generatePhenotype(classId, semesterData.disciplines, turnTimeSlots, true)
                    );
                    const originalMutation = (p) => mutationFunction(p, true);
                    const wrappedMutation = (phenotype) => {
                        mutationCount++;
                        const oldFitness = fitnessFunction(phenotype);
                        const newPhenotype = originalMutation(phenotype);
                        const newFitness = fitnessFunction(newPhenotype);
                        if (newFitness > oldFitness) {
                            successfulMutationCount++;
                        }
                        return newPhenotype;
                    };
                    const config = {
                        mutationFunction: wrappedMutation,
                        crossoverFunction,
                        fitnessFunction,
                        population,
                        populationSize: 3000,
                        mutationRate: 0.3,
                        crossoverRate: 0.9,
                        elitism: 0.1,
                        doesABeatBFunction: (a, b) => fitnessFunction(a) > fitnessFunction(b),
                    };
                    const ga = new GeneticAlgorithmConstructor(config);
                    // Calculate initial metrics
                    const initialFitnesses = ga.population().map(fitnessFunction);
                    const initialBestFitness = Math.max(...initialFitnesses);
                    const initialAvgFitness = initialFitnesses.reduce((sum, val) => sum + val, 0) / initialFitnesses.length || 0;
                    convergenceData[historyKey].iterations.push(0);
                    convergenceData[historyKey].bestFitness.push(initialBestFitness);
                    convergenceData[historyKey].avgFitness.push(initialAvgFitness);
                    let bestTimetable = null;
                    let bestFitness = -Infinity;
                    let stagnantIterations = 0;
                    const maxStagnant = 500;
                    let iteration = 0;
                    const maxIterations = 2500;
                    let foundValid = false;
                    for (iteration = 0; iteration < maxIterations; iteration++) {
                        ga.evolve();
                        const currentBest = ga.best();
                        const currentFitness = fitnessFunction(currentBest);
                        const populationFitness = ga.population().map(fitnessFunction);
                        const avgPopFitness = populationFitness.reduce((a, b) => a + b, 0) / populationFitness.length;
                        // Atualiza histórico
                        convergenceData[historyKey].iterations.push(iteration + 1);
                        convergenceData[historyKey].bestFitness.push(currentFitness);
                        convergenceData[historyKey].avgFitness.push(avgPopFitness);
                        if (currentFitness > bestFitness) {
                            bestFitness = currentFitness;
                            bestTimetable = JSON.parse(JSON.stringify(currentBest));
                            stagnantIterations = 0;
                        } else {
                            stagnantIterations++;
                            convergenceData[historyKey].maxEstagnacao = Math.max(convergenceData[historyKey].maxEstagnacao, stagnantIterations);
                        }
                        // Verifica se achou solução válida
                        const isValid = reportConflicts(currentBest).length === 0 &&
                            meetsWeeklyRequirements(currentBest, semesterData.disciplines);
                        if (isValid && !foundValid) {
                            convergenceData[historyKey].validSolutionsFound++;
                            convergenceData[historyKey].convergedAt = iteration + 1;
                            foundValid = true;
                            bestTimetable = currentBest;
                            break;
                        }
                        if (stagnantIterations >= maxStagnant) {
                            break;
                        }
                    }
                    if (!bestTimetable || reportConflicts(bestTimetable).length > 0) {
                        console.warn(`Modo relaxado ativado para ${historyKey}`);
                        population = Array(100).fill().map(() =>
                            generatePhenotype(classId, semesterData.disciplines, turnTimeSlots, false)
                        );
                        const originalMutationRelaxed = (p) => mutationFunction(p, false);
                        const wrappedMutationRelaxed = (phenotype) => {
                            mutationCount++;
                            const oldFitness = fitnessFunction(phenotype);
                            const newPhenotype = originalMutationRelaxed(phenotype);
                            const newFitness = fitnessFunction(newPhenotype);
                            if (newFitness > oldFitness) {
                                successfulMutationCount++;
                            }
                            return newPhenotype;
                        };
                        config.mutationFunction = wrappedMutationRelaxed;
                        config.population = population;
                        const gaRelaxed = new GeneticAlgorithmConstructor(config);
                        // Initial for relaxed
                        const initialFitnessesRelaxed = gaRelaxed.population().map(fitnessFunction);
                        const initialBestRelaxed = Math.max(...initialFitnessesRelaxed);
                        const initialAvgRelaxed = initialFitnessesRelaxed.reduce((sum, val) => sum + val, 0) / initialFitnessesRelaxed.length || 0;
                        convergenceData[historyKey].iterations.push(convergenceData[historyKey].iterations.length - 1 + 1); // Continue from last
                        convergenceData[historyKey].bestFitness.push(initialBestRelaxed);
                        convergenceData[historyKey].avgFitness.push(initialAvgRelaxed);
                        bestFitness = -Infinity;
                        stagnantIterations = 0; // Reset for relaxed
                        iteration = 0;
                        for (iteration = 0; iteration < 1000; iteration++) {
                            gaRelaxed.evolve();
                            const candidate = gaRelaxed.best();
                            const fitness = fitnessFunction(candidate);
                            const avgPopFitness = gaRelaxed.population().map(fitnessFunction).reduce((a, b) => a + b, 0) / gaRelaxed.population().length;
                            convergenceData[historyKey].iterations.push(convergenceData[historyKey].iterations.length);
                            convergenceData[historyKey].bestFitness.push(fitness);
                            convergenceData[historyKey].avgFitness.push(avgPopFitness);
                            if (fitness > bestFitness) {
                                bestFitness = fitness;
                                bestTimetable = JSON.parse(JSON.stringify(candidate));
                                stagnantIterations = 0;
                            } else {
                                stagnantIterations++;
                                convergenceData[historyKey].maxEstagnacao = Math.max(convergenceData[historyKey].maxEstagnacao, stagnantIterations);
                            }
                            if (reportConflicts(candidate).length === 0 &&
                                meetsWeeklyRequirements(candidate, semesterData.disciplines)) {
                                bestTimetable = candidate;
                                convergenceData[historyKey].convergedAt = convergenceData[historyKey].iterations.length - 1;
                                break;
                            }
                        }
                    }
                    // Finaliza dados de convergência
                    convergenceData[historyKey].totalIterations = convergenceData[historyKey].iterations.length - 1; // Number of evolves
                    convergenceData[historyKey].finalFitness = bestFitness;
                    if (bestTimetable) {
                        finalTimetables[courseId].semesters[semesterNumber] = bestTimetable;
                    }
                }
            }
            const allTurnIds = [...new Set(
                Object.values(classesByCourseAndSemester)
                    .flatMap(course => Object.values(course.semesters))
                    .map(sem => sem.turnId)
                    .filter(Boolean)
            )];
            const turns = await db.Turn.findAll({
                where: { id: allTurnIds },
                attributes: ['id', 'id', 'name'],
                raw: true,
            });
            const turnMap = Object.fromEntries(turns.map(t => [t.id, t.name]));
            const semesterCoursePairs = [];
            Object.entries(classesByCourseAndSemester).forEach(([courseId, courseData]) => {
                Object.keys(courseData.semesters).forEach(semesterNumber => {
                    semesterCoursePairs.push({
                        courseId: parseInt(courseId),
                        semesterNumber: parseInt(semesterNumber),
                    });
                });
            });
            const uniqueSemesterNumbers = [...new Set(semesterCoursePairs.map(p => p.semesterNumber))];
            const uniqueCourseIds = [...new Set(semesterCoursePairs.map(p => p.courseId))];
            const semesters = await db.Semester.findAll({
                where: {
                    number: uniqueSemesterNumbers,
                },
                include: [
                    {
                        model: db.Course,
                        as: 'courses',
                        attributes: ['id'],
                        where: { id: uniqueCourseIds },
                        required: true,
                    },
                ],
                attributes: ['id', 'number'],
                raw: true,
                nest: true,
            });
            const semesterMap = {};
            semesters.forEach(s => {
                const courseId = s.courses?.id || s['courses.id'];
                if (courseId && s.number != null) {
                    semesterMap[`${s.number}_${courseId}`] = s.id;
                }
            });
            const transformedData = Object.entries(finalTimetables).map(([courseId, courseData]) => {
                const courseCode = classesByCourseAndSemester[courseId]?.code || 'UNKNOWN';
                const classes = Object.entries(courseData.semesters)
                    .map(([semesterNumber, timetable]) => {
                        const semesterData = classesByCourseAndSemester[courseId]?.semesters?.[semesterNumber];
                        if (!semesterData) return null;
                        const turnName = turnMap[semesterData.turnId] || 'Unknown';
                        const semesterId = semesterMap[`${semesterNumber}_${courseId}`] || null;
                        return {
                            id: timetable.classId,
                            semesterId,
                            name: `Semestre ${semesterNumber}`,
                            code: `${courseCode}-S${semesterNumber}-${turnName}`,
                            turnId: semesterData.turnId,
                            disciplines: timetable.assignments.map(assignment => {
                                const discipline = semesterData.disciplines.find(d => d.id === assignment.disciplineId);
                                const professor = professors.find(p => p.id === assignment.professorId);
                                const preferences = (professorsWithPreferences
                                    .find(p => p.id === assignment.professorId)
                                    ?.prefsDays || []).map(day => ({
                                        dayId: days.find(d => d.name.toLowerCase() === day.name.toLowerCase())?.id || '',
                                        name: day.name,
                                        observation: day.preferencesDay || '',
                                    }));
                                return {
                                    id: assignment.disciplineId,
                                    code: discipline?.code || assignment.disciplineName.slice(0, 3).toUpperCase(),
                                    description: assignment.disciplineName,
                                    professor1: {
                                        id: assignment.professorId,
                                        name: assignment.professorName,
                                        initials: professor?.nameCode || getProfessorInitials(assignment.professorName),
                                    },
                                    day: assignment.day,
                                    startTime: assignment.time.hourStart,
                                    endTime: assignment.time.hourEnd,
                                    hasConflict: false,
                                    preferences,
                                    observation: preferences[0]?.observation || '',
                                };
                            }),
                        };
                    })
                    .filter(Boolean); // remove nulls
                return {
                    id: parseInt(courseId),
                    name: courseData.name,
                    classes,
                };
            });
            const allTimetables = Object.values(finalTimetables).flatMap(course =>
                Object.values(course.semesters)
            );
            const totalClasses = allTimetables.length;
            const totalAssignments = allTimetables.reduce((sum, t) => sum + t.assignments.length, 0);
            // M1 - Validade
            const allConflicts = allTimetables.flatMap(t => reportConflicts(t));
            const validClasses = allTimetables.filter(t => reportConflicts(t).length === 0).length;
            const coverageIssues = allTimetables.filter(t => {
                const semesterData = Object.values(classesByCourseAndSemester)
                    .flatMap(c => Object.values(c.semesters))
                    .find(s => s.classId === t.classId);
                return semesterData && !meetsWeeklyRequirements(t, semesterData.disciplines);
            }).length;
            // M2 - Qualidade
            const allFitnessValues = allTimetables.map(t => fitnessFunction(t));
            const avgFitness = allFitnessValues.reduce((a, b) => a + b, 0) / allFitnessValues.length || 0;
            const maxFitness = Math.max(...allFitnessValues);
            const stdFitness = Math.sqrt(
                allFitnessValues.reduce((sum, f) => sum + Math.pow(f - avgFitness, 2), 0) / allFitnessValues.length
            );
            // Índice de Consecutividade
            let consecutivePairs = 0;
            let possiblePairs = 0;
            allTimetables.forEach(t => {
                const byDay = {};
                t.assignments.forEach(a => {
                    const key = `${a.day}-${a.disciplineId}`;
                    if (!byDay[key]) byDay[key] = [];
                    byDay[key].push(a);
                });
                Object.values(byDay).forEach(slots => {
                    if (slots.length >= 2) {
                        const sorted = slots.sort((a, b) => a.time.hourStart.localeCompare(b.time.hourStart));
                        const turnSlots = getSortedTimeSlots(allTimeSlots, t.classId);
                        for (let i = 1; i < sorted.length; i++) {
                            possiblePairs++;
                            if (areConsecutiveSlots(sorted[i - 1].time, sorted[i].time, turnSlots)) {
                                consecutivePairs++;
                            }
                        }
                    }
                });
            });
            const consecutivityIndex = possiblePairs > 0 ? consecutivePairs / possiblePairs : 1;
            // Balanceamento de Carga
            const professorHours = {};
            allTimetables.forEach(t => {
                t.assignments.forEach(a => {
                    professorHours[a.professorId] = (professorHours[a.professorId] || 0) + 1;
                });
            });
            const hoursArray = Object.values(professorHours);
            const avgHours = hoursArray.reduce((a, b) => a + b, 0) / hoursArray.length || 0;
            const loadStd = Math.sqrt(
                hoursArray.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) / hoursArray.length
            );
            // Uso de Slots
            const totalPossibleSlots = allTimetables.reduce((sum, t) => {
                const turnSlots = allTimeSlots.filter(ts => ts.turnId ===
                    Object.values(classesByCourseAndSemester)
                        .flatMap(c => Object.values(c.semesters))
                        .find(s => s.classId === t.classId)?.turnId
                );
                return sum + (days.length * turnSlots.length);
            }, 0);
            const usedSlotsCount = allTimetables.reduce((sum, t) =>
                sum + new Set(t.assignments.map(a => `${a.day}-${a.time.id}`)).size, 0
            );
            const slotUsage = totalPossibleSlots > 0 ? usedSlotsCount / totalPossibleSlots : 0;
            // Aggregate new metrics from convergenceData
            let totalEvolucoes = 0;
            let sumConvergedAt = 0;
            let countConverged = 0;
            let sumTaxaMelhoria = 0;
            let sumMaxEstagnacao = 0;
            const numClasses = Object.keys(convergenceData).length;
            Object.values(convergenceData).forEach(data => {
                totalEvolucoes += data.iterations.length - 1;
                sumMaxEstagnacao += data.maxEstagnacao;
                if (data.convergedAt !== null) {
                    sumConvergedAt += data.convergedAt;
                    countConverged++;
                }
                const initialF = data.bestFitness[0];
                const finalF = data.bestFitness[data.bestFitness.length - 1];
                const numEvolves = data.iterations.length - 1;
                const taxaM = numEvolves > 0 ? (finalF - initialF) / numEvolves : 0;
                sumTaxaMelhoria += taxaM;
            });
            const avgIterConverg = countConverged > 0 ? sumConvergedAt / countConverged : 0;
            const avgTaxaMelhoria = numClasses > 0 ? sumTaxaMelhoria / numClasses : 0;
            const avgEstagnacao = numClasses > 0 ? sumMaxEstagnacao / numClasses : 0;
            const taxaMutacaoEfetiva = mutationCount > 0 ? successfulMutationCount / mutationCount : 0;
            // M3 - Desempenho
            const totalTimeMs = performance.now() - startTime;
            const totalEvolutions = totalClasses * 2500; // pior caso
            // M4 - Convergência (aproximado, pois não salvamos histórico)
            const estimatedStagnation = allTimetables.filter(t => {
                // Simulação: se fitness alto e válido → convergiu bem
                return fitnessFunction(t) > 1500 && reportConflicts(t).length === 0;
            }).length;
            const metrics = {
                M1_Validade: {
                    taxaConflitos: totalAssignments > 0 ? (allConflicts.length / totalAssignments) : 0,
                    numeroTotalConflitos: allConflicts.length,
                    solucoesValidas: totalClasses > 0 ? (validClasses / totalClasses) : 0,
                    taxaCoberturaSessoes: coverageIssues === 0 ? 1 : 0,
                },
                M2_Qualidade: {
                    fitnessMedio: Number(avgFitness.toFixed(2)),
                    fitnessMaximo: maxFitness,
                    desvioPadraoFitness: Number(stdFitness.toFixed(2)),
                    indiceConsecutividade: Number(consecutivityIndex.toFixed(3)),
                    balanceamentoCarga: Number(loadStd.toFixed(2)),
                    usoSlots: Number(slotUsage.toFixed(3)),
                },
                M3_Desempenho: {
                    tempoExecucaoTotal: `${(totalTimeMs / 1000).toFixed(2)}s`,
                    iteracoesEstimadas: totalEvolutions,
                    tempoPorTurma: totalClasses > 0 ? `${(totalTimeMs / totalClasses).toFixed(1)}ms` : 'N/A',
                    usoMemoria: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    iteracoesAteConvergencia: Number(avgIterConverg.toFixed(1)),
                    taxaMelhoria: Number(avgTaxaMelhoria.toFixed(4)),
                    numeroEvolucoes: totalEvolucoes,
                },
                M4_Convergencia: {
                    turmasConvergiramBem: `${estimatedStagnation}/${totalClasses}`,
                    taxaConvergencia: totalClasses > 0 ? (estimatedStagnation / totalClasses) : 0,
                    diversidadeEstimada: Number(stdFitness.toFixed(2)), // proxy
                    estagnacao: Number(avgEstagnacao.toFixed(1)),
                    taxaMutacaoEfetiva: Number(taxaMutacaoEfetiva.toFixed(3)),
                }
            };
            const dados = {
                totalTurmas: totalClasses,
                turmasValidas: validClasses,
                totalConflitos: allConflicts.length,
                fitnessMedio: avgFitness.toFixed(2),
                metrics: metrics,
                // Para debug (opcional)
                debug: {
                    conflicts: allConflicts.slice(0, 20), // primeiros 20
                    hasAnyConflict: allConflicts.length > 0,
                },
                convergence: Object.entries(convergenceData).map(([label, data]) => ({
                    label,
                    data: data.bestFitness,
                    iterations: data.iterations,
                    avgFitness: data.avgFitness,
                    convergedAt: data.convergedAt,
                    finalFitness: data.finalFitness?.toFixed(2),
                    totalIterations: data.totalIterations,
                    isValid: data.convergedAt !== null
                }))
            };
            async function salvarJsonComoTxt(dados, caminho = 'output.txt') {
                const texto = JSON.stringify(dados, null, 2);
                fs.writeFileSync(caminho, texto, 'utf8');
                console.log(`Arquivo salvo em: ${caminho}`);
            }
            salvarJsonComoTxt(dados, "log.txt");
            fs.writeFileSync(path.join(metricsDir, `${calendarId}_schedule.json`), JSON.stringify(transformedData, null, 2));
            console.log(`Arquivo salvo em: schedule.json`);
            return res.json({
                data: transformedData,
                cached: true,
                status: 'success',
                message: 'Horário gerado com sucesso!',
                generatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error during execution:', error);
            return res.status(500).json({
                status: 'error',
                message: error.message,
                details: error.stack,
            });
        }
    },

    async publicHourGrid(req, res) {
        try {
            const { calendarId } = req.params;
            const existingCalendar = await db.Calendar.findByPk(calendarId);
            if (!existingCalendar) {
                throw new Error('Não foi possível encontrar o calendário.');
            }
            await db.HourGrid.update(
                {
                    publicated: 1
                },
                {
                    where: {
                        calendarId
                    }
                }
            );
            return res.status(200).json({ message: `Horários para o calendário - ${existingCalendar.name} - publicados com sucesso.` });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao publicar os horários deste calendário.',
                details: error.message
            });
        }
    },

    async editHour(req, res) {
        const { data } = req.body;

        try {
            const { calendarId } = req.params;
            const { classId, courseId, code, assignments } = data;
            const updatedAt = new Date();
            const createdAt = new Date();

            // Validação dos campos obrigatórios
            if (!calendarId || !classId || !courseId || !assignments || !Array.isArray(assignments)) {
                throw new Error('calendarId, classId, courseId e assignments são obrigatórios!');
            }

            // Verifica se o calendário existe
            const existingCalendar = await db.Calendar.findByPk(calendarId);
            if (!existingCalendar) {
                throw new Error('Não foi possível encontrar o calendário.');
            }

            // Verifica se o curso existe
            const course = await db.Course.findByPk(courseId);
            if (!course) {
                throw new Error('Não foi possível encontrar o curso.');
            }

            // Verifica se a turma existe
            const classRecord = await db.Classes.findByPk(classId);
            if (!classRecord) {
                throw new Error('Não foi possível encontrar a turma (classId).');
            }

            // Obtém o semesterId a partir do SemesterClass com base no classId
            const semesterClass = await db.SemesterClass.findOne({
                where: { classId },
                transaction: null,
            });
            if (!semesterClass) {
                throw new Error(`A turma (classId: ${classId}) não está associada a nenhum semestre.`);
            }
            const semesterId = semesterClass.semesterId;

            const transaction = await db.sequelize.transaction();
            const { Op } = db.Sequelize;

            try {
                const timeSlots = new Set();

                // Verifica conflitos para cada assignment
                for (const assignment of assignments) {
                    const { professorId, day, time, disciplineName, disciplineId, preferences, professorName } = assignment;
                    const { id: hourId, hourStart, hourEnd } = time;

                    // Verifica se o dia está nas preferências do professor
                    const dayPref = preferences.find(pref => pref.name.toLowerCase() === day.toLowerCase());
                    const dayId = dayPref?.dayId;

                    if (!dayId) {
                        const preferredDaysNames = preferences.map(p => p.name).join(', ');
                        throw new Error(
                            `${professorName} está com a disciplina ${disciplineName} na turma ${classRecord.code} com um horário na ${day} fora de suas preferências. Dias preferidos: ${preferredDaysNames}.`
                        );
                    }

                    // Verifica conflitos internos no mesmo horário
                    const timeSlotKey = `${courseId}-${classId}-${dayId}-${hourId}-${professorId}`;
                    if (timeSlots.has(timeSlotKey)) {
                        throw new Error(
                            `Conflito interno detectado: múltiplas disciplinas alocadas para o mesmo professor (${professorName}) no mesmo horário (${day} às ${hourStart}-${hourEnd})`
                        );
                    }
                    timeSlots.add(timeSlotKey);

                    // Verifica conflitos com outros semestres no mesmo horário
                    const existingSchedule = await db.HourGrid.findOne({
                        where: {
                            courseId,
                            classId,
                            dayId,
                            hourId,
                            userId: professorId,
                            active: 1,
                            calendarId,
                            semesterId: { [Op.ne]: semesterId },
                        },
                        transaction,
                    });

                    if (existingSchedule) {
                        throw new Error(
                            `Conflito detectado: Já existe uma aula alocada para a turma ${classRecord.code} na ${day}-feira, no horário ${hourStart}-${hourEnd} em outro semestre para o professor ${professorName}.`
                        );
                    }

                    // Verifica conflitos de horário do professor em outros calendários ou semestres
                    const professorConflict = await db.HourGrid.findOne({
                        where: {
                            userId: professorId,
                            dayId,
                            active: 1,
                            [Op.or]: [
                                { calendarId: { [Op.ne]: calendarId } },
                                {
                                    calendarId,
                                    semesterId: { [Op.ne]: semesterId },
                                },
                            ],
                        },
                        include: [
                            {
                                model: db.Hours,
                                as: 'hour',
                                required: true,
                                where: {
                                    [Op.and]: [
                                        { hourStart: { [Op.lt]: hourEnd } },
                                        { hourEnd: { [Op.gt]: hourStart } },
                                    ],
                                },
                            },
                            {
                                model: db.Calendar,
                                as: 'calendar',
                                required: true,
                            },
                            {
                                model: db.Course,
                                as: 'course',
                                required: true,
                                include: [
                                    {
                                        model: db.Classes,
                                        as: 'classes',
                                        required: true,
                                        attributes: ['code'],
                                    },
                                ],
                            },
                            {
                                model: db.Discipline,
                                as: 'discipline',
                                required: true,
                                attributes: ['name'],
                            },
                        ],
                        transaction,
                    });

                    if (professorConflict) {
                        const existingHour = professorConflict.hour;
                        const conflictDiscipline = professorConflict.discipline.name;
                        const conflictClass = professorConflict.course.classes[0].code;

                        throw new Error(
                            `${professorName} possui aula na disciplina ${conflictDiscipline}, na turma ${conflictClass}, ` +
                            `na ${day}-feira, no horário das ${existingHour.hourStart} às ${existingHour.hourEnd}, ` +
                            `no calendário ${professorConflict.calendar.name}.\n` +
                            `Portanto, a disciplina ${disciplineName} da turma ${classRecord.code} deve ser alterada para outro horário ou dia.`
                        );
                    }

                    // Verificar conflito matutino após aula noturna no dia anterior
                    const earlyMorningThreshold = '09:00';
                    const lateNightThreshold = '22:00';

                    if (hourStart < earlyMorningThreshold) {
                        const daysOfWeek = ['segunda', 'terça', 'quarta', 'quinta', 'sexta'];
                        const currentDayIndex = daysOfWeek.findIndex(d => d.toLowerCase() === day.toLowerCase());
                        if (currentDayIndex === -1) {
                            throw new Error(`Dia inválido: ${day}`);
                        }
                        const previousDayIndex = currentDayIndex === 0 ? 4 : currentDayIndex - 1;
                        const previousDayName = daysOfWeek[previousDayIndex];

                        const previousDayPref = preferences.find(pref => pref.name.toLowerCase() === previousDayName.toLowerCase());
                        const previousDayId = previousDayPref?.dayId;

                        if (previousDayId) {
                            const lateNightConflict = await db.HourGrid.findOne({
                                where: {
                                    userId: professorId,
                                    dayId: previousDayId,
                                    active: 1,
                                },
                                include: [
                                    {
                                        model: db.Hours,
                                        as: 'hour',
                                        required: true,
                                        where: {
                                            hourEnd: { [Op.gte]: lateNightThreshold },
                                        },
                                    },
                                    {
                                        model: db.Calendar,
                                        as: 'calendar',
                                        required: true,
                                    },
                                    {
                                        model: db.Course,
                                        as: 'course',
                                        required: true,
                                        include: [
                                            {
                                                model: db.Classes,
                                                as: 'classes',
                                                required: true,
                                                attributes: ['code'],
                                            },
                                        ],
                                    },
                                    {
                                        model: db.Discipline,
                                        as: 'discipline',
                                        required: true,
                                        attributes: ['name'],
                                    },
                                ],
                                transaction,
                            });

                            if (lateNightConflict) {
                                throw new Error(
                                    `${professorName} ministra a disciplina ${lateNightConflict.discipline.name} ` +
                                    `na turma ${lateNightConflict.course.classes[0].code} à noite, na ${previousDayName}-feira, ` +
                                    `até às ${lateNightConflict.hour.hourEnd}, no calendário ${lateNightConflict.calendar.name}. ` +
                                    `Portanto, não poderá ministrar aula na ${day}-feira no horário das ${hourStart} ` +
                                    `na turma ${classRecord.code} neste calendário.`
                                );
                            }
                        }
                    }
                }

                const existingPublished = await db.HourGrid.findOne({
                    where: {
                        calendarId,
                        semesterId,
                        courseId,
                        classId,
                        active: 1,
                        publicated: true,
                    },
                    transaction,
                });
                const isPublished = !!existingPublished;

                const disciplineIds = [...new Set(assignments.map(assignment => assignment.disciplineId))];
                for (const disciplineId of disciplineIds) {
                    await db.HourGrid.destroy({
                        where: {
                            calendarId,
                            semesterId,
                            courseId,
                            classId,
                            disciplineId,
                            active: 1,
                        },
                        transaction,
                    });
                    // console.log(
                    //     `--- Removidos todos os registros da disciplina ${disciplineId} ` +
                    //     `para a turma ${classRecord.code}, curso ${courseId}, semestre ${semesterId}, calendário ${calendarId}`
                    // );
                }

                // Cria novos registros no HourGrid
                const hoursGridData = [];
                for (const assignment of assignments) {
                    const { disciplineId, professorId, day, time, preferences } = assignment;
                    const { id: hourId } = time;
                    const dayId = preferences.find(pref => pref.name.toLowerCase() === day.toLowerCase())?.dayId;

                    if (!dayId) {
                        throw new Error('Erro interno: Dia não encontrado para persistência. Contate o suporte.');
                    }

                    const newHour = await db.HourGrid.create(
                        {
                            calendarId,
                            semesterId,
                            courseId,
                            classId,
                            disciplineId,
                            userId: professorId,
                            dayId,
                            hourId,
                            active: 1,
                            publicated: isPublished,
                            createdAt,
                            updatedAt,
                        },
                        { transaction }
                    );
                    hoursGridData.push({ id: newHour.id, dayId: newHour.dayId, hourId: newHour.hourId, classId: newHour.classId });
                }

                await transaction.commit();
                return res.status(200).json(hoursGridData);
            } catch (error) {
                await transaction.rollback();
                return res.status(500).json({ error: `Erro ao atualizar o horário da turma ${classRecord?.code || 'desconhecida'}`, details: error.message });
            }
        } catch (error) {
            return res.status(500).json({ error: `Erro ao atualizar o horário da turma`, details: error.message });
        }
    },

    async viewHourGrid(req, res) {
        try {
            const { calendarId } = req.params;

            const existingCalendar = await db.Calendar.findByPk(calendarId, {
                where: { active: true },
            });
            if (!existingCalendar) {
                throw new Error('Não foi possível encontrar o calendário.');
            }

            const hourGrids = await db.HourGrid.findAll({
                where: {
                    calendarId,
                    active: true,
                },
                include: [
                    {
                        model: db.Discipline,
                        as: 'discipline',
                        required: true,
                        attributes: ['id', 'name', 'code'],
                        order: [['name', 'asc']]
                    },
                    {
                        model: db.User,
                        as: 'teacher',
                        required: true,
                        attributes: ['id', 'name', 'nameCode'],
                        include: [
                            {
                                model: db.DayOfWeek,
                                as: 'prefsDays',
                                required: false,
                                attributes: ['id', 'name'],
                                through: { attributes: ['observation'], as: 'preferencesDay' },
                                order: [['id', 'asc']]
                            },
                        ],
                        order: [['name', 'asc']]
                    },
                    {
                        model: db.Semester,
                        as: 'semester',
                        required: true,
                        attributes: ['id', 'number'],
                        include: [
                            {
                                model: db.Course,
                                as: 'courses',
                                required: true,
                                attributes: ['id', 'name', 'code'],
                                include: [
                                    {
                                        model: db.Classes,
                                        as: 'classes',
                                        required: true,
                                        attributes: ['id', 'code'],
                                        where: { active: true, semester: [db.Sequelize.col('semester.number')] },
                                        include: [{ model: db.Turn, as: 'turn', required: true, attributes: ['name', 'id'] }],
                                    },
                                ],
                                order: [['name', 'asc']]
                            },
                        ],
                    },
                    { model: db.DayOfWeek, as: 'day', required: true, attributes: ['id', 'name'], order: [['id', 'asc']] },
                    { model: db.Hours, as: 'hour', required: true, attributes: ['id', 'hourStart', 'hourEnd', 'turnId'], order: [['hourStart', 'asc']] },
                    { model: db.Calendar, as: 'calendar', required: true, attributes: ['id', 'name'] },
                ],
            });

            if (!hourGrids || hourGrids.length === 0) {
                return res.status(404).json({ error: 'Nenhum horário encontrado para este calendário.' });
            }

            // ---- transformação final no formato desejado ----
            const coursesMap = {};

            hourGrids.forEach(hour => {
                const courseList = hour.semester?.courses || [];
                if (!courseList.length) return;

                let foundCourse, foundClass;
                for (const course of courseList) {
                    const cls = course.classes.find(c => c.id === hour.classId);
                    if (cls) {
                        foundCourse = course;
                        foundClass = cls;
                        break;
                    }
                }
                if (!foundCourse || !foundClass) return;

                if (!coursesMap[foundCourse.id]) {
                    coursesMap[foundCourse.id] = {
                        courseId: foundCourse.id,
                        name: foundCourse.name,
                        semesters: {},
                    };
                }

                if (!coursesMap[foundCourse.id].semesters[foundClass.id]) {
                    coursesMap[foundCourse.id].semesters[foundClass.id] = {
                        classId: foundClass.id,
                        code: foundClass.code,
                        assignments: [],
                    };
                }

                coursesMap[foundCourse.id].semesters[foundClass.id].assignments.push({
                    disciplineId: hour.discipline.id,
                    disciplineCode: hour.discipline.code,
                    disciplineName: hour.discipline.name,
                    professorName: hour.teacher.name,
                    professorId: hour.teacher.id,
                    professorNameCode: hour.teacher.nameCode,
                    observation: hour.teacher.prefsDays?.find(pref => pref.id === hour.day.id)?.preferencesDay?.observation || '',
                    day: hour.day.name,
                    time: hour.hour,
                    preferences: hour.teacher.prefsDays?.map(pref => ({
                        dayId: pref.id,
                        name: pref.name,
                        observation: pref.preferencesDay?.observation || '',
                    })) || [],
                });
            });

            const response = Object.values(coursesMap).map(course => ({
                id: course.courseId,
                name: course.name,
                classes: Object.values(course.semesters).map(semester => ({
                    id: semester.classId,
                    name: `Turma ${semester.code}`,
                    code: semester.code,
                    disciplines: semester.assignments.map(assignment => ({
                        id: assignment.disciplineId,
                        code: assignment.disciplineCode,
                        description: assignment.disciplineName,
                        professor1: {
                            id: assignment.professorId,
                            name: assignment.professorName,
                            initials: assignment.professorNameCode || getProfessorInitials(assignment.professorName),
                        },
                        day: assignment.day,
                        startTime: assignment.time?.hourStart,
                        endTime: assignment.time?.hourEnd,
                        preferences: assignment.preferences || [],
                        observation: assignment.observation || '',
                        turnId: assignment.time?.turnId,
                    })),
                    turnId: semester.assignments[0]?.time?.turnId,
                })),
            }));

            return res.status(200).json(response);

        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao visualizar os horários deste calendário.',
                details: error.message,
            });
        }
    },

    async viewAllHourGrid(req, res) {
        try {
            const hourGrids = await db.HourGrid.findAll({
                where: {
                    active: true,
                },
                include: [
                    {
                        model: db.Discipline,
                        as: 'discipline',
                        required: true,
                        attributes: ['id', 'name', 'code'],
                    },
                    {
                        model: db.User,
                        as: 'teacher',
                        required: true,
                        attributes: ['id', 'name', 'nameCode'],
                        include: [
                            {
                                model: db.DayOfWeek,
                                as: 'prefsDays',
                                required: true,
                                attributes: ['id', 'name'],
                                through: { attributes: ['observation'] },
                            },
                        ],
                    },
                    {
                        model: db.Semester,
                        as: 'semester',
                        required: true,
                        attributes: ['id', 'number'],
                        include: [
                            {
                                model: db.Course,
                                as: 'courses',
                                required: true,
                                attributes: ['id', 'name', 'code'],
                                include: [
                                    {
                                        model: db.Classes,
                                        as: 'classes',
                                        required: true,
                                        attributes: ['id', 'code'],
                                        where: {
                                            active: true,
                                            semester: [db.Sequelize.col('semester.number')],
                                        },
                                        include: [
                                            {
                                                model: db.Turn,
                                                as: 'turn',
                                                required: true,
                                                attributes: ['name'],
                                            }
                                        ]
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: db.DayOfWeek,
                        as: 'day',
                        required: true,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: db.Hours,
                        as: 'hour',
                        required: true,
                        attributes: ['id', 'hourStart', 'hourEnd', 'turnId'],
                    },
                    {
                        model: db.Calendar,
                        as: 'calendar',
                        required: true,
                        attributes: ['id', 'name'],
                    },
                ],
            });

            if (!hourGrids || hourGrids.length === 0) {
                return res.status(404).json({
                    error: 'Nenhum horário encontrado para este calendário.',
                });
            }

            const semestersMap = new Map();
            hourGrids.forEach((hour) => {
                const semesterId = hour.semesterId || null;
                const semesterNumber = hour.semester ? hour.semester.number : null;
                const courseId = hour.courseId || null;
                const classData = hour.semester?.courses[0]?.classes[0] || {};

                const semesterKey = semesterId || 'null';
                if (!semestersMap.has(semesterKey)) {
                    semestersMap.set(semesterKey, {
                        semesterId,
                        semesterNumber,
                        classId: classData.id || null,
                        classCode: classData.code + classData.turn.name || null,
                        courseId,
                        courseName: hour.semester?.courses[0]?.name || null,
                        assignments: [],
                    });
                }

                const semester = semestersMap.get(semesterKey);
                semester.assignments.push({
                    disciplineId: hour.discipline.id,
                    disciplineName: hour.discipline.name,
                    disciplineCode: hour.discipline.code,
                    professorId: hour.teacher.id,
                    professorName: hour.teacher.name,
                    professorNameCode: hour.teacher.nameCode,
                    professorObservation: hour.teacher.prefsDays.find(pref => pref.id === hour.dayId)?.preferencesDay || '',
                    day: hour.day.name,
                    preferences: hour.teacher.prefsDays.map((pref) => ({
                        dayId: pref.id,
                        name: pref.name,
                    })),
                    time: {
                        id: hour.hour.id,
                        hourStart: hour.hour.hourStart,
                        hourEnd: hour.hour.hourEnd,
                        turnId: hour.hour.turnId,
                    },
                });
            });

            const formattedResponse = {
                data: Array.from(semestersMap.values()),
            };

            return res.status(200).json(formattedResponse);
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao visualizar os horários deste calendário.',
                details: error.message,
            });
        }
    },

    async createHour(req, res) {
        const { data } = req.body;

        try {
            const { calendarId } = req.params;
            const { classId, courseId, assignments } = data;
            const semesterId = data.id;
            const createdAt = new Date();
            const updatedAt = new Date();
            const active = 1;

            if (!calendarId || !classId || !courseId || !semesterId || !assignments || !Array.isArray(assignments)) {
                throw new Error('calendarId, classId, courseId, semesterId e assignments são obrigatórios!');
            }

            const existingCalendar = await db.Calendar.findByPk(calendarId);
            if (!existingCalendar) {
                throw new Error('Não foi possível encontrar o calendário.');
            }

            const course = await db.Course.findByPk(courseId);
            if (!course) {
                throw new Error('Não foi possível encontrar o curso.');
            }

            const classRecord = await db.Classes.findByPk(classId);
            if (!classRecord) {
                throw new Error('Não foi possível encontrar a turma (classId).');
            }

            const semesterClass = await db.SemesterClass.findOne({
                where: { semesterId, classId }
            });
            if (!semesterClass) {
                throw new Error(`A turma (classId: ${classId}) não está associada ao semestre (semesterId: ${semesterId}).`);
            }

            const transaction = await db.sequelize.transaction();
            const { Op } = db.Sequelize;

            try {
                for (const assignment of assignments) {
                    const { professorId, day, time, disciplineName, disciplineId, preferences, professorName } = assignment;
                    const { id: hourId, hourStart, hourEnd } = time;

                    const dayPref = preferences.find(pref => pref.name.toLowerCase() === day.toLowerCase());
                    const dayId = dayPref?.dayId;

                    if (!dayId) {
                        const preferredDaysNames = preferences.map(p => p.name).join(', ');
                        throw new Error(
                            `${professorName} está com a disciplina ${disciplineName} na turma ${classRecord.code} com um horário na ${day} fora de suas preferências. Dias preferidos: ${preferredDaysNames}.`
                        );
                    }

                    // Verificar conflito com o professor
                    const professorConflict = await db.HourGrid.findOne({
                        where: {
                            userId: professorId,
                            dayId,
                            active: 1,
                        },
                        include: [
                            {
                                model: db.Hours,
                                as: 'hour',
                                required: true,
                                where: {
                                    [Op.and]: [
                                        { hourStart: { [Op.lt]: hourEnd } },
                                        { hourEnd: { [Op.gt]: hourStart } },
                                    ],
                                },
                            },
                            {
                                model: db.Calendar,
                                as: 'calendar',
                                required: true,
                            },
                            {
                                model: db.Course,
                                as: 'course',
                                required: true,
                                include: [
                                    {
                                        model: db.Classes,
                                        as: 'classes',
                                        required: true,
                                        attributes: ['code'],
                                    },
                                ],
                            },
                            {
                                model: db.Discipline,
                                as: 'discipline',
                                required: true,
                                attributes: ['name'],
                            },
                        ],
                        transaction,
                    });

                    if (professorConflict) {
                        const existingHour = professorConflict.hour;
                        const conflictDiscipline = professorConflict.discipline.name;
                        const conflictClass = professorConflict.course.classes[0].code;

                        throw new Error(
                            `${professorName} possui aula na disciplina ${conflictDiscipline}, na turma ${conflictClass}, ` +
                            `na ${day}-feira, no horário das ${existingHour.hourStart} às ${existingHour.hourEnd}, ` +
                            `no calendário ${professorConflict.calendar.name}. ` +
                            `Portanto, a disciplina ${disciplineName} da turma ${classRecord.code} deve ser alterada para outro horário ou dia.`
                        );
                    }

                    // Verificar conflito matutino após aula noturna no dia anterior
                    const earlyMorningThreshold = '09:00';
                    const lateNightThreshold = '22:00';

                    if (hourStart < earlyMorningThreshold) {
                        const daysOfWeek = ['segunda', 'terça', 'quarta', 'quinta', 'sexta'];
                        const currentDayIndex = daysOfWeek.findIndex(d => d.toLowerCase() === day.toLowerCase());
                        if (currentDayIndex === -1) {
                            throw new Error(`Dia inválido: ${day}`);
                        }
                        const previousDayIndex = currentDayIndex === 0 ? 4 : currentDayIndex - 1;
                        const previousDayName = daysOfWeek[previousDayIndex];

                        const previousDayPref = preferences.find(pref => pref.name.toLowerCase() === previousDayName.toLowerCase());
                        const previousDayId = previousDayPref?.dayId;

                        if (previousDayId) {
                            const lateNightConflict = await db.HourGrid.findOne({
                                where: {
                                    userId: professorId,
                                    dayId: previousDayId,
                                    active: 1,
                                },
                                include: [
                                    {
                                        model: db.Hours,
                                        as: 'hour',
                                        required: true,
                                        where: {
                                            hourEnd: { [Op.gte]: lateNightThreshold },
                                        },
                                    },
                                    {
                                        model: db.Calendar,
                                        as: 'calendar',
                                        required: true,
                                    },
                                    {
                                        model: db.Course,
                                        as: 'course',
                                        required: true,
                                        include: [
                                            {
                                                model: db.Classes,
                                                as: 'classes',
                                                required: true,
                                                attributes: ['code'],
                                            },
                                        ],
                                    },
                                    {
                                        model: db.Discipline,
                                        as: 'discipline',
                                        required: true,
                                        attributes: ['name'],
                                    },
                                ],
                                transaction,
                            });

                            if (lateNightConflict) {
                                throw new Error(
                                    `${professorName} ministra a disciplina ${lateNightConflict.discipline.name} ` +
                                    `na turma ${lateNightConflict.course.classes[0].code} à noite, na ${previousDayName}-feira, ` +
                                    `até às ${lateNightConflict.hour.hourEnd}, no calendário ${lateNightConflict.calendar.name}. ` +
                                    `Portanto, não poderá ministrar aula na ${day}-feira no horário das ${hourStart} ` +
                                    `na turma ${classRecord.code} neste calendário.`
                                );
                            }
                        }
                    }
                }

                const hoursGridData = [];
                for (const assignment of assignments) {
                    const { disciplineId, professorId, day, time, preferences } = assignment;
                    const { id: hourId } = time;

                    const dayId = preferences.find(pref => pref.name.toLowerCase() === day.toLowerCase())?.dayId;
                    if (!dayId) {
                        throw new Error('Erro interno: Dia não encontrado para persistência. Contate o suporte.');
                    }

                    let hour = await db.HourGrid.create(
                        {
                            calendarId,
                            disciplineId,
                            userId: professorId,
                            dayId,
                            hourId,
                            semesterId,
                            courseId,
                            classId,
                            createdAt,
                            updatedAt,
                            active,
                            publicated: 0,
                        },
                        { transaction }
                    );
                    hoursGridData.push({ id: hour.id, dayId: hour.dayId, hourId: hour.hourId, classId: hour.classId });
                }

                await transaction.commit();
                return res.status(201).json(hoursGridData);
            } catch (error) {
                await transaction.rollback();
                return res.status(500).json({ error: `Erro ao salvar o horário da turma ${classRecord.code}`, details: error.message });
            }
        } catch (error) {
            return res.status(500).json({ error: `Erro ao salvar o horário da turma`, details: error.message });
        }
    },

    async hasHourPublicated(req, res) {
        try {
            const { calendarId } = req.params;
            const existingCalendar = await db.Calendar.findByPk(calendarId);
            if (!existingCalendar) {
                return res.status(404).json({ error: 'Não foi possível encontrar o calendário.' });
            }

            const hourGrid = await db.HourGrid.findOne({
                where: {
                    calendarId,
                    publicated: true,
                    active: true
                }
            });

            if (!hourGrid) {
                return res.status(200).json({ message: 'Não foi possível encontrar um horário publicado para este calendário.', result: false });
            }

            return res.status(200).json({ result: true });

        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao verificar se existe um horário publicado para este calendário.',
                details: error.message
            });
        }
    },

    async hasHourGenerated(req, res) {
        try {
            const { calendarId } = req.params;
            const existingCalendar = await db.Calendar.findByPk(calendarId);
            if (!existingCalendar) {
                return res.status(404).json({ error: 'Não foi possível encontrar o calendário.' });
            }

            const hourGrid = await db.HourGrid.findOne({
                where: {
                    calendarId,
                    active: true
                }
            });

            if (!hourGrid) {
                return res.status(200).json({ message: 'Não foi possível encontrar um horário salvo para este calendário.', result: false });
            }

            return res.status(200).json({ result: true });

        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao verificar se existe um horário salvo para este calendário.',
                details: error.message
            });
        }
    },

    async deleteHour(req, res) {
        try {
            const { calendarId } = req.params;
            const existingCalendar = await db.Calendar.findByPk(calendarId, {
                where: {
                    active: true
                }
            });
            if (!existingCalendar) {
                return res.status(404).json({ error: 'Não foi possível encontrar o calendário.' });
            }

            await db.HourGrid.destroy({
                where: {
                    calendarId,
                    active: true,
                    publicated: false
                }
            });

            return res.status(204).send();

        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao deletar o horário.',
                details: error.message
            });
        }
    }
};

export default HourGridController;
