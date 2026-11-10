require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const { closeBrowser } = require('./src/utils/pdf-renderer');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    console.log('✅ Database connected successfully');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });

    // Close the shared headless Chromium cleanly (avoids orphan chrome processes)
    const shutdown = async () => { server.close(); await closeBrowser(); process.exit(0); };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
