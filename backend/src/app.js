const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const whatsappLogRoutes = require('./routes/whatsappLogRoutes');
const smsLogRoutes = require('./routes/smsLogRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/whatsapp-logs', whatsappLogRoutes);
app.use('/api/sms-logs', smsLogRoutes);

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
