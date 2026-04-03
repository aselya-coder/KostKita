import './config/env.js';
import app from './app.js';
import { initCronJobs } from './cron/expired-listings.js';
import prisma from './config/prisma.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test DB connection
    try {
      await prisma.$connect();
      console.log('Successfully connected to database.');
    } catch (dbError) {
      console.error('Database connection failed but starting server anyway:', dbError);
    }

    // Initialize Cron Jobs
    initCronJobs();

    // Start Express Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
