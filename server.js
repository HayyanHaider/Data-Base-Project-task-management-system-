// /backend/server.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { poolPromise } = require('./db/sqlConnection');

const app = express();
app.use(express.json());
app.use(cors());

// Health‑check endpoint
app.get('/', (req, res) => {
  res.send('✅ Task Management API is running');
});

// Mount feature routers
app.use('/auth',        require('./routes/authRoutes'));
app.use('/Users',       require('./routes/userRoutes'));
app.use('/Roles',       require('./routes/roleRoutes'));
app.use('/Permissions', require('./routes/permissionRoutes'));
// …later: app.use('/Projects', require('./routes/projectRoutes')); etc.

// Initialize DB pool once at startup
poolPromise
  .then(() => console.log('✅ Database pool initialized'))
  .catch(err => {
    console.error('❌ Failed to initialize DB pool:', err);
    process.exit(1);
  });

// Single listen call
const PORT = process.env.PORT || 300;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// … after your existing mounts …
app.use('/Projects', require('./routes/projectRoutes'));
