import express from 'express';
import cors from 'cors';
import classesRoutes from './routes/classesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import disciplineRoutes from './routes/disciplineRoutes.js';
import typeLearnRoutes from './routes/typeLearnRoutes.js';
import turnRoutes from './routes/turnRoutes.js'
import calendarRoutes from './routes/calendarRoutes.js';
import dayOfWeekRoutes from './routes/dayOfWeekRoutes.js';
import coordinationRoutes from './routes/coordinationRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';
import hourGridRoutes from './routes/hourGridRoutes.js';
import hourRoutes from './routes/hourRoutes.js';
import courseGridRoutes from './routes/courseGridRoutes.js';
import internalRoutes from './routes/internalRoutes.js';

const app = express();

// Configurar CORS
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/classes', classesRoutes);
app.use('/api/login', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/disciplines', disciplineRoutes);
app.use('/api/type-learn', typeLearnRoutes);
app.use('/api/turns', turnRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/daysOfWeek', dayOfWeekRoutes);
app.use('/api/coordination', coordinationRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/hour-grid', hourGridRoutes);
app.use('/api/hours',hourRoutes);
app.use('/api/course-grid',courseGridRoutes);
app.use('/api/internal', internalRoutes);
export default app;
