import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import validationRulesRoutes from './routes/validationRules.js';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/validation-rules', validationRulesRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});