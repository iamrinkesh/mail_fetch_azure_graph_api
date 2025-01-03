const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const emailRoutes = require('./routes/emailRoutes');
const logger = require('./utils/logger');
const config = require('./config/config');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use cookie parser to handle cookies
app.use(cookieParser());

// Session middleware
app.use(
    session({
        secret: 'your-session-secret', // Use a secure secret
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to `true` for HTTPS
    })
);

// Routes
app.use(emailRoutes);

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).send('Internal Server Error');
});

// Start the server
const PORT = config.port || 3000;
app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
