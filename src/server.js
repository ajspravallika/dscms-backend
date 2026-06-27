require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`DSCMS backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

startServer();

// Basic safety net for unhandled promise rejections so the process
// fails loudly instead of silently hanging.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
